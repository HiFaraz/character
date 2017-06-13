/**
 * Identity Desk
 * Copyright(c) 2017 Faraz Syed
 * MIT Licensed
 */

'use strict';

export { identityDesk };

/**
 * Module dependencies.
 */

// import authenticators from '../authentication/authenticators';
import config from './config';
// import database from './database';

/**
 * Express middleware for Identity Desk
 *
 * @param {string} path Path to the configuration file
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @return {Object}
 */
// function express(path, store) {
//   return middleware('express', path, { store });
// }

/**
 * Generic middleware method
 *
 * @param {string} framework Framework name. Currently only `express` is supported
 * @param {string} path Path to the configuration file
 * @param {string} [dependencies={}] Framework specific dependencies
 * @return {Object}
 */
// function middleware(framework, path, dependencies = {}) {
//   const settings = config.load(path);

//   const auths = (settings.isValid) ? authenticators.load(settings.authenticators) : null;
//   const db = (settings.isValid) ? database.load(settings.database) : null;

//   const shutdown = function shutdown() {
//     if (db) {
//       db.close();
//     }
//   };

//   return require(`../frameworks/${framework}`).middleware(auths, db, settings, dependencies); // ideally the middleware generator should consume services directly, not a database that it uses to construct a service
// }

/**
 * Create Identity Desk middleware
 *
 * @param {Object} options
 * @param {string|Object} options.config Path to the configuration YAML/JSON file or configuration object
 * @param {Array|Object} options.framework Array with structure: `[framework, dependencies]`. Can also pass a framework module directly if there are no dependencies
 * @param {Object[]} [options.plugins]
 */
function identityDesk(options) {

  const _framework = (Array.isArray(options.framework)) ? options.framework : [options.framework, {}];

  // get configuration

  const defaults = [_framework[0].defaults, ...options.plugins.map(plugin => plugin.defaults)].filter(value => Boolean(value));
  const validators = [_framework[0].config.validate, ...options.plugins.map(plugin => plugin.config.validate)].filter(value => Boolean(value));

  const configuration = config.load(options.config, { defaults, validators });

  console.log(configuration);

  //
}