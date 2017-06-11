/**
 * Authenticator module management
 *
 * On start-up:
 * - verify that authenticator modules are installed
 *
 * @module
 */

'use strict';

export default {
  load,
};

/**
 * Create a hash table of authenticator modules
 * @alias module:lib/authenticators.load
 * @param {Object} authenticators
 * @returns {Object} Hash table of authenticator modules
 */
function load(authenticators) {
  const result = {};

  Object.keys(authenticators).forEach(name => {
    try {
      result[name] = require(authenticators[name].module);
    } catch (error) {
      throw new Error(`module \`${authenticators[name].module}\` not installed for authenticator \`${name}\``);
    }
  });

  return result;
}