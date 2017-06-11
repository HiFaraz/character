/**
 * Identity Desk
 *
 * @author Faraz Syed <hello@farazsyed.com>
 * @copyright 2017 Faraz Syed
 * @license MIT
 * @module
 */

'use strict';

// Must import entry-point code first
import './lib/entry';

/**
 * Modules
 */
import authenticators from 'lib/authenticators';
import config from 'lib/config';
import database from 'lib/database';

/**
 * Express middleware for Identity Desk
 * @param {string} path Path to the configuration file
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @returns {Object} Express middleware for Identity Desk
 */
exports.express = function express(path, store) {
  return middleware('express', path, { store });
};

/**
 * Generic middleware method
 * @param {string} framework Framework name. Currently only `express` is supported
 * @param {string} path Path to the configuration file
 * @param {string} [dependencies={}] Framework specific dependencies
 * @returns {Object} Middleware for Identity Desk
 */
function middleware(framework, path, dependencies = {}) {

  const settings = config.load(path);

  exports.shutdown = function shutdown() {
    database.close();
  };

  return require(`frameworks/${framework}`).middleware(
    authenticators.load(settings.authenticators),
    database.load(settings.database), // ideally the middleware generator should consume services directly, not a database that it uses to construct a service
    settings,
    dependencies
  );
}