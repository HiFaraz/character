/**
 * Identity Desk
 * Copyright(c) 2017 Faraz Syed
 * MIT Licensed
 */

'use strict';

export default main;

/**
 * Module dependencies.
 */

import { clone, flow } from 'lodash';
import CoreFramework from './framework';
import CorePlugin from './plugin';
import capitalize from 'capitalize';
import config from './config';
import database from './database';
import models from './models';

const debug = require('debug')('identity-desk:core');

class IdentityDesk {
  /**
   * Create Identity Desk middleware
   *
   * @param {Object} options
   * @param {string|Object} options.config Path to the configuration YAML/JSON file or configuration object
   * @param {Array|Object} options.framework Array with structure: `[framework, dependencies]`. Can also pass a framework module directly if there are no dependencies
   * @param {Array[]|Object[]} [options.plugins] Array with structure `...[plugin, dependencies]`. Can also pass a plugin module directly in the array if there are no dependencies
   */
  constructor(options) {
    debug('initializing');
    this.options = clone(options);

    // default to Express framework support
    this.options.framework =
      this.options.framework || require('../frameworks/express');

    // transform inputs into structure: `[module, dependencies = {}]`
    // and expose the underlying class to gain access to defaults and validators
    const transform = value => (Array.isArray(value) ? value : [value, {}]);
    this.options.framework = flow(transform, ([module, dependencies]) => [
      module(CoreFramework),
      dependencies,
    ])(this.options.framework);
    this.options.plugins = options.plugins.map(
      flow(transform, ([module, dependencies]) => [
        module(CorePlugin),
        dependencies,
      ]),
    );

    const [Framework] = this.options.framework;

    // configure

    const defaults = [
      Framework.defaults(),
      ...this.options.plugins.map(([Plugin]) => ({
        plugins: { [Plugin.name()]: Plugin.defaults() },
      })),
    ].filter(Boolean);

    // load Core and Plugin models
    this.models = {};
    Object.keys(models).forEach(
      name => (this.models[`core$${capitalize(name)}`] = models[name]),
    );
    this.options.plugins.map(([Plugin]) => {
      Plugin.name();
      Object.keys(Plugin.models()).forEach(
        name =>
          (this.models[
            `${Plugin.name()}$${capitalize(name)}`
          ] = Plugin.models()[name]),
      );
    });

    const validators = [
      Framework.validateConfig,
      ...this.options.plugins.map(([Plugin]) => Plugin.validateConfig),
    ].filter(Boolean);

    this.config = config.load(this.options.config, {
      defaults,
      validators,
    });

    if (this.config.isValid) {
      this.database = database.load(this.config.database, this.models);
    }

    debug(require('util').inspect(this.config, false, null));

    // initialize

    this.plugins = this.options.plugins.map(([Plugin, dependencies]) => {
      // TODO document that plugin dependencies will already contain a `database` property, which will overwrite whatever is provided
      dependencies.database = this.database;
      return new Plugin(
        Object.assign(this.config.plugins[Plugin.name()], {
          isValid: this.config.isValid,
        }),
        dependencies,
      );
    });

    this.framework = new Framework(this.config, this.database, this.plugins);
  }

  /**
   * Example usage:
   *
   * - Express: app.use(identityDesk.app);
   *
   * @return {Object}
   */
  get app() {
    return this.framework.app;
  }

  /**
   * Initialize the database. Use when starting with a clean database
   * 
   * @return {Promise}
   */
  async initDB() {
    return this.database.init();
  }

  shutdown() {
    debug('shutting down');
    this.database.close();
  }
}

/**
   * Create Identity Desk middleware
   *
   * @param {Object} options
   * @param {string|Object} options.config Path to the configuration YAML/JSON file or configuration object
   * @param {Array|Object} options.framework Array with structure: `[framework, dependencies]`. Can also pass a framework module directly if there are no dependencies
   * @param {Array[]|Object[]} [options.plugins] Array with structure `...[plugin, dependencies]`. Can also pass a plugin module directly in the array if there are no dependencies
   * @return {Object}
   */
function main(options) {
  return new IdentityDesk(options);
}
