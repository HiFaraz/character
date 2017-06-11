/**
 * Express middleware
 *
 * @module
 */

'use strict';

import configure from 'frameworks/express/lib/configure';
import express from 'express';

/**
 *
 * @param {Object} authenticators
 * @param {Object} database
 * @param {Object} settings
 * @param {Object} dependencies
 * @returns {Object} Express middleware
 */
export function middleware(authenticators, database, settings, dependencies) {
  const app = express();


  // pre-authenticator configuration
  configure.beforeAuthenticators(app, database, dependencies.store, settings);

  // attach authenticators

  // post-authenticator configuration
  configure.afterAuthenticators(app);

  return app;
}