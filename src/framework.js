'use strict';

/**
 * Module dependencies.
 */

import { and, check } from './utils';
import { Router } from 'express';
import bodyParser from 'body-parser';
import { clone } from 'lodash';

const debug = require('debug')('character:framework');

module.exports = class Framework {
  /**
   * Do not override the constructor
   *
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
      this.router.use(
        `${this.config.base}${plugin.config.base}`,
        plugin.router,
      );
      this.postRouterMiddleware.push(...plugin.postRouterMiddleware);
    });
  }

  /**
   * Override this with an app property if needed, which is served by the core module as character.app
   *
   * @return {Object}
   */
  get app() {
    const router = Router();

    router.use(
      ...this.preRouterMiddleware,
      this.router,
      ...this.postRouterMiddleware,
    );

    return router;
  }

  static defaults() {
    return {
      base: '/id',
      proxy: false,
    };
  }

  /**
   * Override this with a validator function that returns either `true` or `false`
   *
   * @param {Object} data
   * @return {Boolean}
   */
  static validateConfig(data) {
    return and(
      check(data, 'missing configuration'),
      check(data.base, 'base path is missing'),
      check(
        data.base && !['', '/'].includes(data.base),
        'base path cannot be empty string or root path',
      ),
      check(typeof data.proxy === 'boolean', 'proxy configuration is missing'),
    );
  }
};
