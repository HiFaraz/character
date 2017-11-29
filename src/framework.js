'use strict';

/**
 * Module dependencies.
 */

import { and, check } from './utils';
import { Router } from 'express';
import bodyParser from 'body-parser';
import { clone } from 'lodash';

const debug = require('debug')('character:framework');

export default class Framework {
  /**
   * Do not override the constructor
   *
   * @param {Object} config
   * @param {Object[]} [plugins=[]]
   */
  constructor(config, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.config = clone(config);

    this.preRouterMiddleware = []; // to be mounted on root path
    this.router = Router(); // to be mounted on base path
    this.postRouterMiddleware = []; // to be mounted on root path

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
   * TODO fix this description, this is from the multi-framework concept
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
      base: '/id', // TODO what should this be?
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
}
