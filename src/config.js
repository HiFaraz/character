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
  // registerAuthenticator,
  populateEnvironmentVariables,
  readFileSync,
  validate,
  validateAuthenticator,
};

/**
 * Module dependencies.
 */

import { clone, flow } from 'lodash';
import { assert } from './utils';
import read from 'read-data';

/**
 * Applies default configuration values
 *
 * @param {Object} config
 * @return {Object} Configuration populated with default values where needed
 */
function applyDefaults(config) {
  return Object.assign(
    readFileSync('.identity-desk.defaults.yml'),
    config
  );
}

/**
 * Load a configuration file synchronously
 *
 * @param {string} [path='.identity-desk.yml'] Path to the configuration file
 * @return {Object} Settings
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

  // session secret
  data.session.secret = safeGetEnvString(data.session.secret, 'Session secret');

  return data;
}

/**
 * Read a YAML or JSON file synchronously
 *
 * @param {string} path Path to the YAML or JSON file
 * @return {Object}
 */
function readFileSync(path) {
  return read.sync(path);
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
 * @param {Object} config
 * @return {Object}
 */
function validate(config) {

  const result = clone(config);

  result.isValid = and(
    assert(config.database, 'missing database configuration'),
    assert(typeof config.database === 'string' || typeof config.database === 'object', 'database configuration must be either URL string or Sequelize options object'),
    assert(config.authenticators && Object.keys(config.authenticators).length > 0, 'missing authenticators'),
    ...Object.keys(config.authenticators).map(name => validateAuthenticator(name, config.authenticators[name])),
    assert(config.session.secret, 'missing environment variable reference for session secret key')
  );

  return result;
}

/**
 * Validate an authenticator
 *
 * @param {string} name Authenticator name
 * @param {Object} authenticator
 * @param {string} authenticator.module Module name
 * @param {string} authenticator.source Either `npm` or `local`
 * @param {string} [authenticator.path] Path of local authenticator module
 * @return {boolean}
 */
function validateAuthenticator(name, authenticator) {
  return (typeof authenticator === 'object') && and(
    assert(authenticator.module, `missing module for authenticator \`${name}\``),
    assert(authenticator.source, `missing source for authenticator \`${name}\`. Must be either \`npm\` or \`local\``),
    assert((authenticator.source === 'local') ? authenticator.path : true, `missing path for authenticator \`${name}\``)
  );
  // TODO: for source = local, check that we have a local copy of this file for future re-installs @ authenticator.path
}

/**
 * Perform a logical AND on parameters
 *
 * @param {...boolean} values Input values
 * @return {boolean} Result of logical AND
 */
function and(...values) {
  return values.includes(false) === false;
}