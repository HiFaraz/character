'use strict';

export default {
  load,
};

/**
 * Module dependencies.
 */

import Sequelize from 'sequelize';
import capitalize from 'capitalize';
import fs from 'fs';
import path from 'path';

let database; // will be populated by load()

/**
 * Create a database object and load models
 * 
 * @param {Object|string} options 
 * @return {Object}
 */
function load(options) {
  if (!database) {
    database = new Database(options);
    // await database.init(); // TODO find a good place for the init call
  }
  return database;
}

class Database {
  /**
   * Create a database object and load models
   *
   * @param {Object|string} options Sequelize database options
   */
  constructor(options) {
    this.connection = new Sequelize(options);
    this.directory = options.directory || './models';
    this.suffix = options.suffix || '.model.js';

    this._definitions().forEach(filename => this._import(filename));
    this._afterImport();
  }

  _afterImport() {
    Object.keys(this.connection.models).forEach(name => {
      const Model = this.connection.model(name);
      if (Model.associate) {
        Model.associate(this);
      }
    });
  }

  /**
   * List model definition files
   * 
   * @return {string[]}
   */
  _definitions() {
    return fs
      .readdirSync(path.resolve(__dirname, this.directory)) // TODO promisify
      .filter(
        item =>
          item.endsWith(this.suffix) &&
          fs.statSync(path.resolve(__dirname, this.directory, item)).isFile(),
      );
  }

  _import(filename) {
    const Model = this.connection.import(
      path.resolve(__dirname, this.directory, filename),
    );
    this[capitalize(Model.name)] = Model;
  }

  async init() {
    await this.connection.authenticate();
    await this.connection.sync();
  }
}
