'use strict';

/**
 * Module dependencies.
 */

import Koa from 'koa';
import Router from 'koa-router';
import Stream from 'stream';
import { asyncEnabled } from '../utils';
import { clone } from 'lodash';
import isJSON from 'koa-is-json';
import onFinished from 'on-finished';
import path from 'path';
import read from 'read-data';
import statuses from 'statuses';

/**
 * Safely require a module which requires Node v7.6+. Falls back to a local copy
 *
 * @param {string} module
 * @returns {*}
 */
const asyncSafeRequire = module => require((asyncEnabled() ? '' : './vendor/') + module);

const bodyParser = asyncSafeRequire('koa-bodyparser');
const compose = asyncSafeRequire('koa-compose');

const debug = require('debug')('identity-desk:core:framework');

module.exports = class CoreFramework {

  /**
   * @param {Object} database
   * @param {Object} settings
   * @param {Object[]} [plugins=[]] Array of koa-router instances
   */
  constructor(database, settings, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.settings = clone(settings);

    this.preRouterMiddleware = []; // not part of the router, is added directly to the root app
    this.router = new Router();
    this.postRouterMiddleware = []; // not part of the router, is added directly to the root app

    // this.routes is the root app, needs to next into the root app
    // this.router is only for ID routes, will not need to next into the root app
    // in the end, use compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware])

    this.router.use((ctx, next) => {
      ctx.res.sendStatus = code => {
        ctx.status = code;

        // ignore body on certain codes
        if (statuses.empty[code]) {
          // strip headers
          ctx.body = null;
        }
        ctx.res.end();
      };
      next();
    });

    this.router.use(bodyParser());

    // load plugins
    plugins.forEach(plugin => {
      this.preRouterMiddleware.push(...plugin.preRouterMiddleware);
      this.router.use(this.settings.base, plugin.router.routes());
      this.router.use(this.settings.base, plugin.router.allowedMethods());
      this.postRouterMiddleware.push(...plugin.postRouterMiddleware);
    });
  }

  /**
   * Override this with your app property, which is served by the core module as identityDesk.app
   *
   * @return {Object}
   */
  get app() {
    return compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware]);
  }

  static defaults() {
    return read.sync(path.resolve(__dirname, './defaults.yml'));
  }

  /**
   * Express/Connect-compatible middleware
   *
   * Modifed version of Koa's `callback()` method:
   * https://github.com/koajs/koa/blob/ee5af59f1f847922c9cf41ccedbdbe6a3c024c2e/lib/application.js#L125
   *
   * @returns {Object}
   */
  expressify() {
    const app = new Koa();
    app.use(compose([...this.preRouterMiddleware, this.router.routes(), this.router.allowedMethods(), ...this.postRouterMiddleware])); // do not rely on `this.app` since higher-level frameworks will overwrite it
    const fn = compose(app.middleware);

    if (!app.listeners('error').length) {
      app.on('error', app.onerror);
    }

    return async(req, res, next) => {
      const ctx = app.createContext(req, res);
      const onerror = err => ctx.onerror(err);
      onFinished(res, onerror);
      try {
        await fn(ctx); // modified: do not return after fn(ctx)

        if (!ctx.writable) {
          return; // returning without `next()` ends the Express response
        }

        let body = ctx.body;

        if ('HEAD' == ctx.method) { // eslint-disable-line eqeqeq
          if (!ctx.res.headersSent && isJSON(body)) {
            ctx.length = Buffer.byteLength(JSON.stringify(body));
          }
          return ctx.res.end();
        }

        // responses
        if (Buffer.isBuffer(body)) {
          return ctx.res.end(body);
        }
        if ('string' == typeof body) { // eslint-disable-line eqeqeq
          return ctx.res.end(body);
        }
        if (body instanceof Stream) {
          return body.pipe(ctx.res); // TODO: Koa relies on Node.js v7.6+ Streams, test if this works properly on supported Node.js versions
        }

        if (body) { // modified: only return if `body` is truthy
          // body: json
          body = JSON.stringify(body);
          if (!ctx.res.headersSent) {
            ctx.length = Buffer.byteLength(body);
          }
          return ctx.res.end(body);
        }

        // modified: if we haven't ended the response yet,
        // transfer the `req` and `res` to Express
        Object.assign(req, ctx.req);
        Object.assign(res, ctx.res, { sendStatus: res.sendStatus }); // do not overwrite Express's `res.sendStatus` method
        next();
      } catch (error) {
        onerror(error);
      }
    };
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