/**
 * Express middleware
 *
 * @module
 */

'use strict';

import express from 'express';

export function middleware(authenticators, database, settings) {
  const app = express();
  app.use((req, res, next) => {
    req.isAuthenticated = () => false;
    req.logout = () => res.redirect('/');
    next();
  });
  return app;
}