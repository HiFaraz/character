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

const debug = require('debug')('identity-desk:authentication:modules');

/**
 * Create an array of authenticator modules
 *
 * @param {Object} authenticators
 * @return {Array}
 */
function load(authenticators) {
  return Object.keys(authenticators).reduce((modules, name) => {
    const module = authenticators[name].module; // the module name
    try {
      // return modules.concat([name, require(module)]); // TODO re-enable when modules are actually installed on `package.json`
      return modules.concat([
        [name, require(`../authenticators/${module}/index.js`)],
      ]); // TODO disable. Temporary code until modules are actually installed on `package.json`
    } catch (error) {
      const message = `module \`${module}\` not installed for authenticator \`${name}\``;
      if (process.env.NODE_ENV === 'production') {
        throw new Error(message);
      } else {
        debug(message);
        return modules;
      }
    }
  }, []);
}