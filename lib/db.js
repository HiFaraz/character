'use strict';

/**
 * Module dependencies.
 */

const Sequelize = require('sequelize');
const capitalize = require('capitalize');
const { forEach, reduce } = require('lodash');

const debug = require('debug')('character:database');

module.exports = {
  create,
  defineModel,
  init,
  load,
};

/**
 * Create a Sequelize database object
 *
 * @param {Object|string} options Sequelize database options
 * @return {Object}
 */
function create(options) {
  return new Sequelize(options);
}

/**
 * Initialize a Sequelize database object
 *
 * Authenticates and syncs the the database object
 *
 * @param {Object} db
 */
async function init(db) {
  await db.authenticate();
  await db.sync();
}

/**
 * Load models
 *
 * @param {Object} definitions
 * @param {Object} db
 * @return {Object}
 */
function load(definitions, db) {
  const models = reduce(
    definitions,
    (models, definition, name) => {
      return Object.assign(models, defineModel(name, definition, db));
    },
    {},
  );

  // Run model-specific `define` and `associate` methods
  forEach(definitions, (definition, name) => {
    if (definition.define) {
      // Model.define is where class and instance methods may be defined
      definition.define(db.models[name]);
      debug(`ran custom definitions for model ${capitalize(name)}`);
    }
    if (definition.associate) {
      // Model.associate is where associations may be defined
      definition.associate(models);
      debug(`created associations defined by model ${capitalize(name)}`);
    }
  });

  return models;
}

/**
 * Define a Sequelize model
 *
 * @param {string} name
 * @param {Object} model
 * @param {function} [model.attributes=()=>{}]
 * @param {Object} [model.options={}]
 * @param {Object} db
 * @return {Object}
 */
function defineModel(name, { attributes = () => {}, options = {} }, db) {
  const Model = db.define(name, attributes(Sequelize), options);
  debug(`defined model ${capitalize(name)}`);
  return { [capitalize(name)]: Model };
}
