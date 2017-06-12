/**
 * Custom assertion library. Only uses a hard assertion in production, else logs a warning
 *
 * @module
 */

import assert from 'assert';
// TODO use a logging library

const log = console.log;

/**
 * Assert in production, warn in other environments
 *
 * @param {*} value Value to assert
 * @param {string} message Message on assertion failure
 * @returns {boolean} Does value exist?
 */
export default function assertion(value, message) {
  if (process.env.NODE_ENV === 'production') {
    assert(value, message);
  } else if (!value) {
    log(message);
  }
  return Boolean(value);
}