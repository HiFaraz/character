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

    this.define();
  }

  /**
   * Override this with a function to define router configuration
   */
  define() {
    // Example: this.router.use(...)
  }
};
