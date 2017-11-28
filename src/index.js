/**
 * Character
 * Copyright(c) 2017 Faraz Syed
 * MIT licensed
 */

'use strict';

import './entry'; // must import entry-point code first

module.exports = main;

/**
 * Module dependencies.
 */

import { clone, flow, mapKeys } from 'lodash';
import EventEmitter from 'events';
import Framework from './framework';
import Plugin from './plugin';
import capitalize from 'capitalize';
import config from './config';
import database from './database';
import models from './models';

const debug = require('debug')('character');

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
    this.events = new EventEmitter();

    this.options = clone(options);

    this._preparePlugins();

    // Load configuration with defaults and validate it
    this.config = config.load(this.options.config, {
      defaults: this.defaults,
      validators: this.validators,
    });

    if (this.config.isValid) {
      this._loadModels();

      // Instantiate the database
      this.database = database.instantiate(this.config.database, this.models);
    }

    this._instantiatePlugins();

    // Instantiate the framework
    this._framework = new Framework(this.config, this._plugins);
  }

  /**
   * Example usage:
   *
   * - Express: app.use(character.app);
   *
   * @return {Object}
   */
  get app() {
    return this._framework.app;
  }

  get defaults() {
    return [
      Framework.defaults(),
      ...this.options.plugins.map(([Plugin]) => ({
        plugins: { [Plugin.name()]: Plugin.defaults() },
      })),
    ].filter(Boolean);
  }

  get validators() {
    return [
      Framework.validateConfig,
      ...this.options.plugins.map(([Plugin]) => Plugin.validateConfig),
    ].filter(Boolean);
  }

  /**
   * Instantiate plugins
   *
   * Plugins are passed their specific config (i.e. the contents of
   * `plugins.<name>`)
   */
  _instantiatePlugins() {
    const instantiate = ([Plugin, deps]) => {
      const config = Object.assign(this.config.plugins[Plugin.name()], {
        isValid: this.config.isValid,
      });
      return new Plugin(config, this.database, deps, this.events);
    };
    this._plugins = this.options.plugins.map(instantiate);
  }

  /**
   * Load core and plugin models and declare the database/ORM object
   */
  _loadModels() {
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
  _preparePlugins() {
    const prepareWith = component =>
      flow(
        value => (Array.isArray(value) ? value : [value, {}]), // default to empty dependencies
        ([module, deps]) => [module(component), deps], // hydrate with `component`
      );
    this.options.plugins = this.options.plugins
      .map(prepareWith(Plugin))
      .filter(([Plugin]) => {
        if (!Plugin.validateSelf()) {
          debug(
            `could not load plugin ${Plugin.name()}, failed self validation`,
          );
          return false;
        } else {
          return true;
        }
      });
  }
}

/**
 * Create Character instance
 *
 * @param {Object} options
 * @return {Object}
 */
function main(options) {
  return new Character(options);
}
