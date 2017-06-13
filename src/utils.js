import coreAssert from 'assert';

const debug = require('debug')('identity-desk:lib:assert');

export {
  assert,
};

/**
 * Assert in production, warn in other environments
 *
 * @param {*} value Value to assert
 * @param {string} message Message on assertion failure
 * @return {boolean}
 */
function assert(value, message) {
  if (process.env.NODE_ENV === 'production') {
    coreAssert(value, message);
  } else if (!value) {
    debug(message);
  }
  return Boolean(value);
}