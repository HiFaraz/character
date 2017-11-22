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
   * @param {Object} dependencies
   */
  constructor(name, settings, dependencies) {
    this.router = Router();
    this.settings = clone(settings);
    this.dependencies = dependencies;
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
