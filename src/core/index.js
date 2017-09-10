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

import { clone, flow, mapKeys } from 'lodash';
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
    this.loadConfig();

    if (this.config.isValid) {
      this.loadModels();
      this.instantiateDatabase();
    }

    debug(require('util').inspect(this.config, false, null));

    this.instantiatePlugins();
    this.instantiateFramework();
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

  get defaults() {
    const [Framework] = this.options.framework;
    return [
      Framework.defaults(),
      ...this.options.plugins.map(([Plugin]) => ({
        plugins: { [Plugin.name()]: Plugin.defaults() },
      })),
    ].filter(Boolean);
  }

  get validators() {
    const [Framework] = this.options.framework;
    return [
      Framework.validateConfig,
      ...this.options.plugins.map(([Plugin]) => Plugin.validateConfig),
    ].filter(Boolean);
  }

  /**
   * Instantiate the database
   */
  instantiateDatabase() {
    this.database = database.instantiate(this.config.database, this.models);
  }

  /**
   * Instantiate the framework
   */
  instantiateFramework() {
    const [Framework] = this.options.framework;
    this.framework = new Framework(this.config, this.database, this.plugins);
  }

  /**
   * Instantiate plugins
   * 
   * Plugins are passed their specific config (i.e. the contents of
   * `plugins.<name>`)
   */
  instantiatePlugins() {
    const instantiate = ([Plugin, dependencies]) => {
      // TODO document that plugin dependencies will already contain a `database` property, which will overwrite whatever is provided
      dependencies.database = this.database;
      const config = Object.assign(this.config.plugins[Plugin.name()], {
        isValid: this.config.isValid,
      });
      return new Plugin(config, dependencies);
    };
    this.plugins = this.options.plugins.map(instantiate);
  }

  /**
   * Load configuration with defaults and validate it
   */
  loadConfig() {
    this.config = config.load(this.options.config, {
      defaults: this.defaults,
      validators: this.validators,
    });
  }

  /**
   * Load core and plugin models and declare the database/ORM object
   */
  loadModels() {
    const prefixModelKeys = (models, prefix) =>
      mapKeys(models, (model, name) => `${prefix}$${name}`);

    const attachCoreModels = data =>
      Object.assign(data, prefixModelKeys(models, 'core'));

    const attachPluginModels = data => {
      const allPluginModels = [];
      this.options.plugins.forEach(([Plugin]) => {
        const config = this.config.plugins[Plugin.name()]; // TODO validate that each plugin has a name and that it is a string
        const pluginModels = Plugin.models(config); // plugins are passed their config to let them dynamically generate models
        allPluginModels.push(prefixModelKeys(pluginModels, Plugin.name()));
      });
      return Object.assign(data, ...allPluginModels);
    };

    // Convert the model names into camel$Case, which is camelCase but with `$` to denote namespaces
    const toCamel$Case = (model, key) =>
      flow(
        key => key.split('$'),
        pieces => [pieces[0], ...pieces.slice(1).map(capitalize)].join('$'),
      )(key);
    const convertNames = data => mapKeys(data, toCamel$Case);

    this.models = flow(attachCoreModels, attachPluginModels, convertNames)({});
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
