/**
 * Attach body parsers to Express
 *
 * @module
 */
'use strict';

export default {
  attach,
};

/**
 * Modules
 */
import bodyParser from 'body-parser';

/**
 * Attach body parsers for all base routes
 *
 * @param {Object} app Express app
 * @param {Object} settings
 * @param {string} settings.base Mount path for Identity Desk authentication middleware
 * @alias module:frameworks/express/lib/parsers.attach
 */
function attach(app, settings) {
  app.use(settings.base, bodyParser.json());
  app.use(settings.base, bodyParser.urlencoded({ extended: true }));
}