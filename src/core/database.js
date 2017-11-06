'use strict';

export default {
  instantiate,
};

/**
 * Module dependencies.
 */

import Sequelize from 'sequelize';
import capitalize from 'capitalize';
import { forEach } from 'lodash';

const debug = require('debug')('identity-desk:database');

/**
 * Create a database object and load models
 * 
 * @param {Object|string} options 
 * @param {Object} models 
 * @return {Object}
 */
function instantiate(options, models) {
  return new Database(options, models);
}

class Database {
  /**
   * Create a database object and load models
   *
   * @param {Object|string} options Sequelize database options
   * @param {Object} models
   */
  constructor(options, models) {
    this._models = models; // hang on to the definitions
    this.connection = new Sequelize(options);
    this.models = {};

    forEach(this._models, (model, name) => this._define(name, model));
    this._afterDefine();
  }

  /**
   * Run model-specific `define` and `associate` methods
   */
  _afterDefine() {
    Object.keys(this._models).forEach(name => {
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
}
