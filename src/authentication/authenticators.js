/**
 * Authenticator module management
 *
 * On start-up:
 * - verify that authenticator modules are installed
 */

'use strict';

export default {
  load,
};

/**
 * Create a hash table of authenticator modules
 *
 * @param {Object} authenticators
 * @return {Object}
 */
function load(authenticators) {
  const result = {};

  Object.keys(authenticators).forEach(name => {
    try {
      result[name] = require(authenticators[name].module);
    } catch (error) {
      // TODO: should be a fatal error in production, else should just be a warning that disables the authenticator and warns the developer
      throw new Error(`module \`${authenticators[name].module}\` not installed for authenticator \`${name}\``);
    }
  });

  return result;
}