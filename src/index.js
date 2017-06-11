/**
 * Identity Desk
 *
 * @author Faraz Syed <hello@farazsyed.com>
 * @copyright 2017 Faraz Syed
 * @license MIT
 * @module
 */

'use strict';

export {
  express,
};

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
 * @returns {Object} Express middleware for Identity Desk
 */
function express(path) {
  return middleware('express', path);
}

/**
 * Generic middleware method
 * @param {string} framework Framework name. Currently only `express` is supported
 * @param {string} path Path to the configuration file
 * @returns {Object} Middleware for Identity Desk
 */
function middleware(framework, path) {

  const settings = config.load(path);

  return require(`frameworks/${framework}`).middleware(
    authenticators.load(settings.authenticators),
    database.load(settings.database), // ideally the middleware generator should consume services directly, not a database that it uses to construct a service
    settings
  );
}