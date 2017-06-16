'use strict';

/**
 * Module dependencies.
 */

import Router from 'koa-router';
import { clone } from 'lodash';

module.exports = class CorePlugin {

  /**
   * @param {Object} settings
   * @param {Object} dependencies
   */
  constructor(settings, dependencies) {
    this.preRouterMiddleware = []; // not part of the router, is added directly to the root app
    this.postRouterMiddleware = []; // not part of the router, is added directly to the root app
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

  /**
   * Override this with your validator function
   *
   * @param {Object} data
   * @return {Boolean}
   */
  static validateConfig(data) {
    return true;
  }

  /**
   * Override this to return your plugin defaults
   *
   * @return {Object}
   */
  static defaults() {
    return {};
  }

};