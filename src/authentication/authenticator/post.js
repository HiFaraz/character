'use strict';

/**
 * Module dependencies.
 */
import Router from 'koa-router';
import { clone } from 'lodash';

module.exports = class CorePOSTAuthenticator {

  /**
   * @param {string} name
   * @param {Object} settings
   * @param {Object} dependencies
   */
  constructor(name, settings, dependencies) {
    this.router = new Router();
    this.settings = clone(settings);
    this.dependencies = dependencies;

    this.define();
  }

  /**
   * Override this with your router configuration
   * Do not put your router configuration in the constructor
   */
  define() {
    // Example: this.router.use(...)
  }

};