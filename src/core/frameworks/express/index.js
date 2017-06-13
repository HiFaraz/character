'use strict';

import configure from './configure';
import express from 'express';

const debug = require('debug')('identity-desk:frameworks:express');

/**
 * Create Express middleware
 *
 * @param {Object} authenticators
 * @param {Object} database
 * @param {Object} settings
 * @param {Object} dependencies
 * @return {Object}
 */
export function middleware(authenticators, database, settings, dependencies) {
  const app = express();

  /**
   * Two types of middleware:
   * - authenticator middleware (only if settings are valid)
   * - admin GUI (configuration, user admin)
   */

  if (settings.isValid) {

    // pre-authenticator configuration
    configure.beforeAuthenticators(app, database, dependencies.store, settings);

    // attach authenticators

    // post-authenticator configuration
    configure.afterAuthenticators(app);
  } else {
    debug('Not attaching middleware. Fix your config and restart the server');
  }

  return app;
}