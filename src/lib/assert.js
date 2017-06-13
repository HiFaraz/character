import assert from 'assert';

const debug = require('debug')('identity-desk:lib:assert');

/**
 * Assert in production, warn in other environments
 *
 * @param {*} value Value to assert
 * @param {string} message Message on assertion failure
 * @return {boolean}
 */
export default function assertion(value, message) {
  if (process.env.NODE_ENV === 'production') {
    assert(value, message);
  } else if (!value) {
    debug(message);
  }
  return Boolean(value);
}