/**
 * Identity Desk
 * Copyright(c) 2017 Faraz Syed
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

// import authenticators from '../authentication/authenticators';
import CoreFramework from './framework';
import { clone } from 'lodash';
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

    // transform inputs

    const transform = value => (Array.isArray(value)) ? value : [value, {}];
    this.options.framework = transform(options.framework);
    this.options.plugins = options.plugins.map(transform);

    const Framework = this.options.framework[0](CoreFramework);

    // configure

    const defaults = [
      Framework.defaults(),
      ...this.options.plugins.map(([plugin]) => plugin.defaults),
    ].filter(Boolean);

    const validators = [
      Framework.config.validate,
      ...this.options.plugins.map(([plugin]) => plugin.config.validate),
    ].filter(Boolean);

    this.configuration = config.load(this.options.config, { defaults, validators });

    if (this.configuration.isValid) {
      this.database = database.load(this.configuration.database);
    }

    this.framework = new Framework(this.database, this.configuration);
  }

  /**
   * Example usage:
   *
   * - Express: app.use(identityDesk.app());
   * - Koa: app.use(identityDesk.app())
   *
   * @return {Object}
   */
  app() {
    return this.framework.app();
  }

  shutdown() {
    debug('shutting down');
    this.database.close();
  }
}