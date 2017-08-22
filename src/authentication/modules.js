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
 * Module dependencies.
 */
import { mapValues } from 'lodash';

const debug = require('debug')('identity-desk:authentication:modules');

/**
 * Create a hash table of authenticator modules
 *
 * @param {Object} authenticators
 * @return {Object}
 */
function load(authenticators) {
  return mapValues(authenticators, (authenticator, name) => {
    const module = authenticator.module; // the module name
    try {
      // return require(module); // TODO re-enable when modules are actually installed on `package.json`
      return require(`../authenticators/${module}/index.js`); // TODO disable. Temporary code until modules are actually installed on `package.json`
    } catch (error) {
      const message = `module \`${module}\` not installed for authenticator \`${name}\``;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(message);
      } else {
        debug(message);
        return null;
      }
    }
  });
}
