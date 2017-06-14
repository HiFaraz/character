'use strict';

/**
 * Module dependencies.
 */

import { assert, asyncEnabled } from '../../utils';
import Koa from 'koa';
import Router from 'koa-router';
import Stream from 'stream';
import { clone } from 'lodash';
import isJSON from 'koa-is-json';
import onFinished from 'on-finished';
import path from 'path';
import read from 'read-data';

/**
 * Safely require a module which requires Node v7.6+. Falls back to a local copy
 *
 * @param {string} module
 * @returns {*}
 */
const asyncSafeRequire = module => require((asyncEnabled() ? '' : './') + module);

const bodyParser = asyncSafeRequire('koa-bodyparser');
const compose = asyncSafeRequire('koa-compose');
const mount = asyncSafeRequire('koa-mount');

const debug = require('debug')('identity-desk:core:framework');

module.exports = class CoreFramework {

  /**
   * @param {Object} database
   * @param {Object} settings
   * @param {Array} [plugins=[]]
   */
  constructor(database, settings, plugins = []) {
    debug(`initializing with ${plugins.length} plugins`);

    this.settings = clone(settings);

    this._app = new Koa();
    const router = new Router();

    // expose the database
    router.use(async function(ctx, next) {
      ctx.database = database;
      ctx.req.isAuthenticated = () => true;
      await next();
    });

    // load plugins
    plugins.forEach(plugin => {
      // plugin routes are mounted at `/`,
      // they are responsible for using the
      // base path at `settings.base`
      router.use(plugin.routes());
      router.use(plugin.allowedMethods());
    });

    // put it all together
    this._app.use(bodyParser());
    this._app.use(router.routes());
    this._app.use(router.allowedMethods());
  }

  app() {
    return mount(this._app);
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
    const app = this._app;
    const fn = compose(app.middleware);

    if (!app.listeners('error').length) {
      app.on('error', app.onerror);
    }

    return async(req, res, next) => {
      // res.statusCode = 404;
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

        //
        // ...

        /**
         * TODO how to send empty status without body,
         * yet still defer to Express?
         *
         * Use res.statusCode and res.end then???
         * or create a ctx.res.sendStatus???
         *
         * Original code:
         *
            const code = ctx.status;

            // ignore body
            if (statuses.empty[code]) {
              // strip headers
              ctx.body = null;
              return ctx.res.end();
            }
         */

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
        Object.assign(res, ctx.res);
        next();
      } catch (error) {
        onerror(error);
      }
    };
  }

  static config() {
    return {
      validate: data => assert(data.session.secret, 'missing environment variable reference for session secret key'),
    };
  }

  static defaults() {
    return read.sync(path.resolve(__dirname, './defaults.yml'));
  }
};