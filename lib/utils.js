'use strict';

module.exports = { and, check, mapValuesDeep };

/**
 * Module dependencies.
 */

const { isObject, mapValues } = require('lodash');
const assert = require('assert');

const debug = require('debug')('character:utils');

/**
 * Perform a logical AND on parameters
 *
 * @param {...boolean} values Input values
 * @return {Boolean} Result of logical AND
 */
function and(...values) {
  return values.length === values.filter(Boolean).length;
}

/**
 * Assert in production, warn in other environments, return a boolean
 *
 * @param {*} value Value to assert
 * @param {string} message Message on assertion failure
 * @return {Boolean}
 */
function check(value, message) {
  if (process.env.NODE_ENV === 'production') {
    assert(value, message);
  } else if (!value) {
    debug(message);
  }
  return Boolean(value);
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
