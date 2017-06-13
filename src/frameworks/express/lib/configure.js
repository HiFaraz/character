/**
 * Express framework configuration
 *
 * Provides methods for configuring Express:
 * - before attaching authenticators
 * - after attaching authenticators
 */

'use strict';

export default {
  afterAuthenticators,
  beforeAuthenticators,
};

/**
 * Module dependencies.
 */

import parsers from 'frameworks/express/lib/parsers';
import requests from 'frameworks/express/lib/requests';
import sessions from 'frameworks/express/lib/sessions';

/**
 * Configure Express before attaching authenticators
 *
 * @param {Object} app Express app
 */
function afterAuthenticators(app) {
  sessions.attach(app);
}

/**
 * Configure Express before attaching authenticators
 *
 * @param {Object} app Express app
 * @param {Object} [database] Sequelize database object. Not needed if a store is provided
 * @param {Object} [store] Store for `express-sessions`. Uses the database if a store is not provided
 * @param {Object} settings
 */
function beforeAuthenticators(app, database, store, settings) {
  parsers.attach(app, settings);
  requests.extend(app);
  sessions.setup(app, database, store, settings);
}