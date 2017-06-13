'use strict';

export default {
  attach,
};

/**
 * Module dependencies.
 */

import bodyParser from 'body-parser';

/**
 * Attach body parsers for all base routes
 *
 * @param {Object} app Express app
 * @param {Object} settings
 * @param {string} settings.base Mount path for Identity Desk authentication middleware
 */
function attach(app, settings) {
  app.use(settings.base, bodyParser.json());
  app.use(settings.base, bodyParser.urlencoded({ extended: true }));
}