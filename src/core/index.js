/**
 * Identity Desk
 * Copyright(c) 2017 Faraz Syed
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

import { clone, flow } from 'lodash';
import CoreFramework from './framework';
import CorePlugin from './plugin';
import config from './config';
import database from './database';

const debug = require('debug')('identity-desk:core');

export default class IdentityDesk {
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

    // transform inputs into structure: `[module, dependencies = {}]`
    // and expose the underlying class to gain access to defaults and validators
    const transform = value => (Array.isArray(value)) ? value : [value, {}];
    this.options.framework = flow(
      transform,
      ([module, dependencies]) => [module(CoreFramework), dependencies],
    )(options.framework);
    this.options.plugins = options.plugins.map(flow(
      transform,
      ([module, dependencies]) => [module(CorePlugin), dependencies],
    ));

    const Framework = this.options.framework[0];

    // configure

    const defaults = [
      Framework.defaults(),
      ...this.options.plugins.map(([Plugin]) => Plugin.defaults()),
    ].filter(Boolean);

    const validators = [
      Framework.validateConfig,
      ...this.options.plugins.map(([Plugin]) => Plugin.validateConfig),
    ].filter(Boolean);

    this.configuration = config.load(this.options.config, { defaults, validators });

    if (this.configuration.isValid) {
      this.database = database.load(this.configuration.database);
    }

    // initialize

    this.plugins = this.options.plugins.map(([Plugin, dependencies]) => {
      // TODO document that plugin dependencies will already contain
      // a `database` property, which will overwrite whatever is provided
      dependencies.database = this.database;
      return new Plugin(this.configuration, dependencies);
    });

    this.framework = new Framework(this.database, this.configuration, this.plugins);
  }

  /**
   * Example usage:
   *
   * - Express: app.use(identityDesk.app);
   * - Koa: app.use(identityDesk.app.routes()), app.use(identityDesk.app.routes())
   *
   * @return {Object}
   */
  get app() {
    return this.framework.app;
  }

  shutdown() {
    debug('shutting down');
    this.database.close();
  }
}