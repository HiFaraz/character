'use strict';

export { createApp };

/**
 * Module dependencies.
 */

import { and, check } from './utils';
import { Router } from 'express';
import bodyParser from 'body-parser';

const debug = require('debug')('character:framework');

/**
 * Export an Express router loaded with plugin routes
 *
 * @param {Object} [config={}]
 * @param {Object[]} [plugins=[]]
 * @return {Object}
 */
function createApp(config = {}, plugins = []) {
  debug(`initializing with ${plugins.length} plugins`);

  config.base = config.base || '/id'; // TODO what should this be?

  const preRouterMiddleware = []; // to be mounted on root path
  const router = Router(); // to be mounted on base path
  const postRouterMiddleware = []; // to be mounted on root path

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  if (validateConfig(config)) {
    // load plugins
    plugins.forEach(plugin => {
      preRouterMiddleware.push(...plugin.preRouterMiddleware);
      router.use(`${config.base}${plugin.config.base}`, plugin.router);
      postRouterMiddleware.push(...plugin.postRouterMiddleware);
    });

    const app = Router();
    app.use(...preRouterMiddleware, router, ...postRouterMiddleware);
    return app;
  } else {
    throw new Error('cannot load Character, invalid framework config');
  }
}

/**
 * Validate framework config
 *
 * @param {Object} data
 * @return {boolean}
 */
function validateConfig(data) {
  return and(
    check(data, 'missing configuration'),
    check(data.base, 'base path is missing'),
    check(
      data.base && !['', '/'].includes(data.base),
      'base path cannot be empty string or root path',
    ),
  );
}
