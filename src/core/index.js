/**
 * Character
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
import EventEmitter from 'events';
import capitalize from 'capitalize';
import config from './config';
import database from './database';
import models from './models';

const debug = require('debug')('character:core');

class Character {
  /**
   * Create Character middleware
   *
   * @param {Object} options
   * @param {string|Object} options.config Path to the configuration YAML/JSON file or configuration object
   * @param {Array[]|Object[]} [options.plugins] Array with structure `...[plugin, deps]`. Can also pass a plugin module directly in the array if there are no dependencies
   */
  constructor(options) {
    debug('initializing');
    this.options = clone(options);

    this.events = new EventEmitter();

    this.preparePlugins();
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
   * - Express: app.use(character.app);
   *
   * @return {Object}
   */
  get app() {
    return this.framework.app;
  }

  get defaults() {
    return [
      CoreFramework.defaults(),
      ...this.options.plugins.map(([Plugin]) => ({
        plugins: { [Plugin.name()]: Plugin.defaults() },
      })),
    ].filter(Boolean);
  }

  get validators() {
    return [
      CoreFramework.validateConfig,
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
    this.framework = new CoreFramework(
      this.config,
      this.database,
      this.plugins,
    );
  }

  /**
   * Instantiate plugins
   *
   * Plugins are passed their specific config (i.e. the contents of
   * `plugins.<name>`)
   */
  instantiatePlugins() {
    const instantiate = ([Plugin, deps]) => {
      // TODO document that plugin dependencies will already contain a `database` property, which will overwrite whatever is provided
      deps.database = this.database;
      const config = Object.assign(this.config.plugins[Plugin.name()], {
        isValid: this.config.isValid,
      });
      return new Plugin(config, deps, this.events);
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
   * dependencies with the structure: `[module, deps = {}]`
   *
   * Framework and plugins are passed to Character as functions which need
   * to be provided core classes to enable class extension
   */
  preparePlugins() {
    const prepareWith = component =>
      flow(
        value => (Array.isArray(value) ? value : [value, {}]), // default to empty dependencies
        ([module, deps]) => [module(component), deps], // hydrate with `component`
      );
    this.options.plugins = this.options.plugins
      .map(prepareWith(CorePlugin))
      .filter(([Plugin]) => {
        if (!Plugin.validateSelf()) {
          debug(`could not load plugin ${Plugin.name()}`);
          return false;
        } else {
          return true;
        }
      });
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
 * Create Character middleware
 *
 * @param {Object} options
 * @param {string|Object} options.config Path to the configuration YAML/JSON file or configuration object
 * @param {Array[]|Object[]} [options.plugins] Array with structure `...[plugin, deps]`. Can also pass a plugin module directly in the array if there are no dependencies
 * @return {Object}
 */
function main(options) {
  return new Character(options);
}
