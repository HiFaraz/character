/**
 * @module
 */
'use strict';

export default {
  load,
};

/**
 * Modules
 */
import Sequelize from 'sequelize';

/**
 * Create a Sequelize database object
 * @alias module:lib/database.load
 * @param {*} database Sequelize database options
 * @returns {Object} Sequelize database object
 */
function load(database) {
  return new Sequelize(database);
}