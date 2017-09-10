/**
 * Identity Desk
 * Copyright(c) 2017 Faraz Syed
 * MIT licensed
 */

'use strict';

export default main;

/**
 * Module dependencies.
 */

import { clone, flow, map, mapKeys } from 'lodash';
import CoreFramework from './framework';
import CorePlugin from './plugin';
import ExpressFramework from '../frameworks/express';
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
    this.options.framework = this.options.framework || ExpressFramework;

    this.prepareModules();

    const [Framework] = this.options.framework;

    // configure

    const defaults = [
      Framework.defaults(),
      ...this.options.plugins.map(([Plugin]) => ({
        plugins: { [Plugin.name()]: Plugin.defaults() },
      })),
    ].filter(Boolean);

    const validators = [
      Framework.validateConfig,
      ...this.options.plugins.map(([Plugin]) => Plugin.validateConfig),
    ].filter(Boolean);

    this.config = config.load(this.options.config, {
      defaults,
      validators,
    });

    if (this.config.isValid) {
      // load Core and Plugin models
      this.models = {};
      Object.keys(models).forEach(
        name => (this.models[`core$${name}`] = models[name]),
      );
      // plugins are passed their config to let them dynamically generate models
      this.options.plugins.forEach(([Plugin]) =>
        map(
          Plugin.models(this.config.plugins[Plugin.name()]),
          (model, name) => {
            this.models[`${Plugin.name()}$${name}`] = model;
          },
        ),
      );

      // Convert the model names into camel$Case, which is camelCase but with `$` to denote namespaces
      this.models = mapKeys(this.models, (model, key) =>
        flow(
          key => key.split('$'),
          pieces => [pieces[0], ...pieces.slice(1).map(capitalize)].join('$'),
        )(key),
      );

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
   * Hydrate the framework and plugin modules, and default to empty
   * dependencies with the structure: `[module, dependencies = {}]`
   * 
   * Framework and plugins are passed to Identity Desk as functions which need
   * to be provided core classes to enable class extension
   */
  prepareModules() {
    const transform = component =>
      flow(
        value => (Array.isArray(value) ? value : [value, {}]),
        ([module, dependencies]) => [module(component), dependencies],
      );
    this.options.framework = transform(CoreFramework)(this.options.framework);
    this.options.plugins = this.options.plugins.map(transform(CorePlugin));
  }

  /**
   * Close open connections
   * 
   * Call this when terminating the process
   */
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
