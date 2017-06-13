'use strict';

export default {
  load,
};

/**
 * Module dependencies.
 */

import Sequelize from 'sequelize';

/**
 * Create a Sequelize database object
 *
 * @param {*} database Sequelize database options
 * @return {Object} Sequelize database object
 */
function load(database) {
  return new Sequelize(database);
}