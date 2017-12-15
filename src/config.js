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
  _safeGetEnvString: safeGetEnvString,
  load,
  populateEnvironmentVariables,
};

/**
 * Module dependencies.
 */

import { check, mapValuesDeep } from './utils';
import { flow } from 'lodash';
import read from 'read-data';

/**
 * Assemble a configuration
 *
 * @return {Object}
 */
function load() {
  return flow(read.sync, populateEnvironmentVariables)('character.yml');
}

/**
 * Populate configuration secrets with values from environment variables
 *
 * @param {Object} config
 * @return {Object} Configuration populated with values from environment variables
 */
function populateEnvironmentVariables(config) {
  return mapValuesDeep(config, safeGetEnvString);
}

/**
 * Read an environment variable and throw if it is undefined (in production)
 *
 * @param {string} name Environment variable name
 * @return {string} Value of the environment variable
 */
function safeGetEnvString(name) {
  if (typeof name === 'string' && name.startsWith('$')) {
    const variable = name.substring(1, name.length);
    // using soft assert so that Character can continue in limited mode with an invalid config
    if (
      check(
        process.env[variable],
        `Missing environment variable \`${variable}\``,
      )
    ) {
      return process.env[variable].trim();
    } else {
      return undefined;
    }
  } else {
    return name;
  }
}
