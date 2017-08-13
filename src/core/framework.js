'use strict';

/**
 * Module dependencies.
 */

import { Router } from 'express';
import bodyParser from 'body-parser';
import { clone } from 'lodash';
import path from 'path';
import read from 'read-data';

const debug = require('debug')('identity-desk:core:framework');

module.exports = class CoreFramework {
  /**
   * @param {Object} config
   * @param {Object} database
   * @param {Object[]} [plugins=[]] Array of express or express.Router instances
   */
  constructor(config, database, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.config = clone(config);

    this.preRouterMiddleware = []; // not part of the router, is mounted directly to the root app
    this.router = Router(); // is mounted to the base path
    this.postRouterMiddleware = []; // not part of the router, is mounted directly to the root app

    this.router.use(bodyParser.json());
    this.router.use(bodyParser.urlencoded({ extended: true }));

    // load plugins
    plugins.forEach(plugin => {
      this.preRouterMiddleware.push(...plugin.preRouterMiddleware);
      this.router.use(this.config.base, plugin.router);
      this.postRouterMiddleware.push(...plugin.postRouterMiddleware);
    });
  }

  /**
   * Override this with your app property, which is served by the core module as identityDesk.app
   *
   * @return {Object}
   */
  get app() {
    const router = Router();

    router.use(
      ...this.preRouterMiddleware,
      this.router,
      ...this.postRouterMiddleware
    );

    return router;
  }

  static defaults() {
    return read.sync(path.resolve(__dirname, './defaults.yml'));
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
};
