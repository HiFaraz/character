'use strict';

/**
 * Module dependencies.
 */

const Sequelize = require('sequelize');
const capitalize = require('capitalize');
const { forEach } = require('lodash');

const debug = require('debug')('character:database');

module.exports = class Database {
  /**
   * Create a database object
   *
   * @param {Object|string} options Sequelize database options
   */
  constructor(options) {
    this.connection = new Sequelize(options);
    this.models = {};
  }

  /**
   * Load models
   *
   * @param {Object} models
   */
  load(models) {
    this._models = models; // hang on to the definitions

    forEach(this._models, (model, name) => this._define(name, model));
    this._afterDefine();
  }

  /**
   * Run model-specific `define` and `associate` methods
   */
  _afterDefine() {
    Object.keys(this._models).forEach(name => {
      // TODO use lodash's forEach method
      const Model = this._models[name];
      if (Model.define) {
        // Model.define is where class and instance methods may be defined
        Model.define(this.connection.models[name]);
        debug(`ran custom definitions for model ${capitalize(name)}`);
      }
      if (Model.associate) {
        // Model.associate is where associations may be defined
        Model.associate(this.models);
        debug(`created associations defined by model ${capitalize(name)}`);
      }
    });
  }

  /**
   * Define a Sequelize model
   *
   * @param {string} name
   * @param {Object} model
   * @param {function} [model.attributes=()=>{}]
   * @param {Object} [model.options={}]
   */
  _define(name, { attributes = () => {}, options = {} }) {
    const Model = this.connection.define(name, attributes(Sequelize), options);
    this.models[capitalize(name)] = Model;
    debug(`defined model ${capitalize(name)}`);
  }

  async init() {
    await this.connection.authenticate();
    await this.connection.sync();
  }
};
