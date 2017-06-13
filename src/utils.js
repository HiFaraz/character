'use strict';

/**
 * Module dependencies.
 */
import coreAssert from 'assert';
import semver from 'semver';

const debug = require('debug')('identity-desk:utils');

export {
  and,
  assert,
  asyncEnabled,
};

/**
 * Perform a logical AND on parameters
 *
 * @param {...boolean} values Input values
 * @return {Boolean} Result of logical AND
 */
function and(...values) {
  return values.includes(false) === false;
}

/**
 * Assert in production, warn in other environments
 *
 * @param {*} value Value to assert
 * @param {string} message Message on assertion failure
 * @return {Boolean}
 */
function assert(value, message) {
  if (process.env.NODE_ENV === 'production') {
    coreAssert(value, message);
  } else if (!value) {
    debug(message);
  }
  return Boolean(value);
}

/**
 * Check if `async await` is enabled in the current Node runtime
 *
 * @return {Boolean}
 */
function asyncEnabled() {
  return semver.gte(process.version, 'v7.6.0');
}