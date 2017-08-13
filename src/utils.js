'use strict';

export { and, assert, asyncEnabled, mapValuesDeep };

/**
 * Module dependencies.
 */

import { isObject, mapValues } from 'lodash';
import coreAssert from 'assert';
import semver from 'semver';

const debug = require('debug')('identity-desk:utils');

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

/**
 * Deep transform all leaf nodes in an Object recursively
 * 
 * @param {*} source Object or leaf node to be transformed
 * @param {Function} transformer
 * @return {*} Transformed Object or leaf node
 */
function mapValuesDeep(source, transformer) {
  if (isObject(source)) {
    return mapValues(source, source => mapValuesDeep(source, transformer));
  } else {
    return transformer(source);
  }
}
