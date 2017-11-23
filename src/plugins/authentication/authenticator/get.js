/**
 * This file is reserved for future development
 *
 * Not ready for use
 */
'use strict';

/**
 * Module dependencies.
 */
import { Router } from 'express';
import { clone } from 'lodash';

module.exports = class CoreGETAuthenticator {
  /**
   * Do not override the constructor
   *
   * @param {string} name
   * @param {Object} settings
   * @param {Object} deps
   */
  constructor(name, settings, deps) {
    this.router = Router();
    this.settings = clone(settings);
    this.deps = deps;
  }

  /**
   * Override this with a function to define an authenticator route
   */
  hubToAuthenticator() {
    /**
     * Example code:
     *
     * return (req, res, next) => {
     *
     * }
     */
  }
};
