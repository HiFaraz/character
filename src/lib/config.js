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
 *
 * @module
 */

'use strict';

export default {
  load,
  // registerAuthenticator,
  populateEnvironmentVariables,
  readFileSync,
  validate,
  validateAuthenticator,
};

import { clone, flow } from 'lodash';
import assert from 'assert';
import read from 'read-data';

/**
 * Applies default configuration values
 * @alias module:lib/config.applyDefaults
 * @param {Object} config
 * @returns {Object} Configuration populated with default values where needed
 */
function applyDefaults(config) {
  return Object.assign(
    readFileSync('.identity-desk.defaults.yml'),
    config
  );
}

/**
 * Load a configuration file synchronously
 * @alias module:lib/config.load
 * @param {string} [path='.identity-desk.yml'] Path to the configuration file
 * @returns {Object} Settings
 */
function load(path = '.identity-desk.yml') {
  return flow(
    readFileSync,
    applyDefaults,
    validate,
    populateEnvironmentVariables
  )(path);
}

/**
 * Populate configuration secrets with values from environment variables
 * @alias module:lib/config.populateEnvironmentVariables
 * @param {Object} config
 * @returns {Object} Configuration populated with values from environment variables
 */
function populateEnvironmentVariables(config) {
  const data = clone(config);

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

  // session secret
  data.session.secret = safeGetEnvString(data.session.secret, 'Session secret');

  return data;
}

/**
 * Read a YAML or JSON file synchronously
 * @alias module:lib/config.readFileSync
 * @param {string} path Path to the YAML or JSON file
 * @returns {Object} File contents parsed to an Object
 */
function readFileSync(path) {
  return read.sync(path);
}

/**
 * Read an environment variable and throw if it is undefined
 * @param {string} name Environment variable name
 * @param {string} description Environment variable description to show in error message if it is undefined
 * @returns {*} Value of the environment variable
 */
function safeGetEnvString(name, description) {
  assert(process.env[name], `${description} not found in environment variable \`${name}\``);
  return process.env[name].trim();
}

/**
 * Validate required configuration parameters
 * @alias module:lib/config.validate
 * @param {Object} config
 * @returns {Object} Configuration (unmodified)
 */
function validate(config) {
  assert(config.database, 'missing database configuration');
  assert(typeof config.database === 'string' || typeof config.database === 'object', 'database configuration must be either URL string or Sequelize options object');
  assert(config.authenticators && Object.keys(config.authenticators).length > 0, 'missing authenticators');
  Object.keys(config.authenticators).forEach(name => validateAuthenticator(name, config.authenticators[name]));
  assert(config.session.secret, 'missing environment variable reference for session secret key');
  return config;
}

/**
 * Validate an authenticator
 * @alias module:lib/config.validateAuthenticator
 * @param {string} name Authenticator name
 * @param {Object} authenticator
 * @param {string} authenticator.module Module name
 * @param {string} authenticator.source Either `npm` or `local`
 * @param {string} [authenticator.path] Path of local authenticator module
 */
function validateAuthenticator(name, authenticator) {
  assert(authenticator.module, `missing module for authenticator \`${name}\``);
  assert(authenticator.source, `missing source for authenticator \`${name}\`. Must be either \`npm\` or \`local\``);
  if (authenticator.source === 'local') {
    assert(authenticator.path, `missing path for authenticator \`${name}\``);
    // TODO: check that we have a local copy of this file for future re-installs @ authenticator.path
  }
}