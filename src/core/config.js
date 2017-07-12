/**
 * Configuration library
 *
 * On start-up:
 * - load a configuration file
 * - validate the configuration
 * - populate configuration secrets from environment variables
 *
 * On configuration:
 * - register authenticators
 */

'use strict';

export default {
  load,
  populateEnvironmentVariables,
  validate,
};

/**
 * Module dependencies.
 */

import { and, assert } from '../utils';
import { clone, flow, merge } from 'lodash';
import read from 'read-data';

/**
 * Applies default configuration values
 *
 * @param {Object[]} [defaults=[]]
 * @return {Object}
 */
function applyDefaults(defaults = []) {
  return data => merge(data, ...defaults);
}

/**
 * Assemble a configuration
 *
 * @param {string|Object} [source='.identity-desk.yml'] Path to the configuration YAML/JSON file or configuration object
 * @param {Object} [extras]
 * @param {Object[]} [extras.defaults] Framework and plugin defaults
 * @param {function[]} [extras.validators] Framework and plugin validators
 * @return {Object}
 */
function load(source = '.identity-desk.yml', extras) {
  const _source = (typeof source === 'string') ? read.sync(source) : source;

  return flow(
    applyDefaults(extras.defaults),
    validate(extras.validators),
    populateEnvironmentVariables,
  )(_source);
}

/**
 * Populate configuration secrets with values from environment variables
 *
 * @param {Object} config
 * @return {Object} Configuration populated with values from environment variables
 */
function populateEnvironmentVariables(config) {
  const data = clone(config);

  // TODO: traverse all leaf nodes instead of only database and session.secret

  // database
  if (typeof data.database === 'string') {
    // database url is provided
    data.database = safeGetEnvString(data.database, 'Database URL');
  } else {
    // database configuration is Sequelize options object
    Object.keys(data.database).forEach(key => {
      data.database[key] = safeGetEnvString(data.database[key], `Database option \`${key}\``);
    });
  }

  // session secret key
  data.session.keys = safeGetEnvString(data.session.keys, 'Session secret key').split(','); // TODO handle this in the authentication plugin somehow

  return data;
}

/**
 * Read an environment variable and throw if it is undefined
 *
 * @param {string} name Environment variable name
 * @param {string} description Environment variable description to show in error message if it is undefined
 * @return {*} Value of the environment variable
 */
function safeGetEnvString(name, description) {
  if (typeof name === 'string' && name.startsWith('$')) {
    const variable = name.substring(1, name.length);
    assert(process.env[variable], `${description} not found in environment variable \`${variable}\``);
    return process.env[variable].trim();
  } else {
    return name;
  }
}

/**
 * Validate required configuration parameters
 *
 * Adds an `isValid` property to the returned configuration
 *
 * @param {Object} [validators]
 * @return {Object}
 */
function validate(validators = []) {
  return data => Object.assign(clone(data), {
    isValid: and(
      assert(data.database, 'missing database configuration'),
      assert(typeof data.database === 'string' || typeof data.database === 'object', 'database configuration must be either URL string or Sequelize options object'),
      ...validators.map(validator => validator(data)),
    ),
  });
}