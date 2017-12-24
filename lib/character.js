/**
 * Character
 * Copyright(c) 2017 Faraz Syed
 * MIT licensed
 */

'use strict';

/**
 * Module dependencies.
 */

const { flow, mapKeys } = require('lodash');
const db = require('./db');
const EventEmitter = require('events');
const capitalize = require('capitalize');
const config = require('./config');
const { createApp } = require('./framework');
const models = require('./models');

const debug = require('debug')('character');

class Character extends EventEmitter {
  constructor() {
    super();

    this.config = config.load();
    this.stack = [];

    // define the database in the constructor to make the init method available
    try {
      this.db = db.create(this.config.database);
    } catch (error) {
      debug('could not connect to database', error);
      this.db = { error };
    }
  }

  /**
   * Initial setup, not to be run on server start
   */
  async bootstrap() {
    if (!this.db.error) {
      await db.init(this.db);
    }
  }

  /**
   * Create a Character subapplication
   *
   * @return {Object}
   */
  create() {
    if (!this.db.error) {
      this.models = db.load(this._loadModels(), this.db);
    }

    return createApp(this.config, this._instantiatePlugins());
  }

  /**
   * Register a plugin
   *
   * @param {class} Plugin
   * @param {Object} [deps={}]
   */
  use(Plugin, deps = {}) {
    this.stack.push([Plugin, deps]);
  }

  /**
   * Instantiate plugins
   *
   * Plugins are passed their specific config (i.e. the contents of
   * `plugins.<name>`) and a reference to this Character instance
   *
   * @return {Object[]}
   */
  _instantiatePlugins() {
    return this.stack.map(([Plugin, deps]) => {
      const config = this.config.plugins[Plugin.name.toLowerCase()];
      return new Plugin(config, deps, this);
    });
  }

  /**
   * Load core and plugin models and declare the database/ORM object
   *
   * @return {Object}
   */
  _loadModels() {
    const prefixKeys = (models, prefix) =>
      mapKeys(models, (model, name) => `${prefix}$${name}`);

    const attachCoreModels = data =>
      Object.assign(data, prefixKeys(models, 'core'));

    const attachPluginModels = data => {
      const allPluginModels = [];
      this.stack.forEach(([Plugin]) => {
        const name = Plugin.name.toLowerCase();
        const config = this.config.plugins[name];
        const pluginModels = Plugin.models(config); // plugins are passed their config to let them dynamically generate models
        allPluginModels.push(prefixKeys(pluginModels, name));
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

    return flow(attachCoreModels, attachPluginModels, convertNames)({});
  }
}

/**
 * Create Character instance
 *
 * @return {Object}
 */
function createCharacter() {
  return new Character();
}

module.exports = createCharacter;

// for better ES module (TypeScript) compatibility
module.exports.default = createCharacter;

module.exports.Character = Character;
