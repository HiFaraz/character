'use strict';

/**
 * Module dependencies.
 */

import { ACCEPTED, OK, SEE_OTHER } from 'http-codes';
import Router from 'koa-router';
import { clone } from 'lodash';
import { STATUS_CODES as httpCodeMessage } from 'http';
import queryString from 'querystring';
import request from 'request-promise';
import url from 'url';

module.exports = class CorePOSTAuthenticator {

  /**
   * @param {string} name
   * @param {Object} settings
   * @param {Object} dependencies
   */
  constructor(name, settings, dependencies) {
    this.debug = require('debug')(`identity-desk:authentication:authenticator:${name}`);
    this.dependencies = dependencies;
    this.name = name;
    this.router = new Router();
    this.settings = clone(settings);

    this.debug('initializing');

    this.router.post('/', async(ctx, next) => {
      this.debug('new request', ctx.path, ctx.request.body);
      const middleware = ({
        authenticator: () => (ctx, next) => {
          this.debug('enter hub request handler');
          return this.hubToAuthenticator()(ctx, next);
        },
        hub: this.clientToHub.bind(this),
      })[ctx.request.body[settings.authenticatorTargetParameter]];
      if (middleware) {
        return middleware()(ctx, next);
      } else {
        return next();
      }
    }, this.dependencies.session, this.appToClient());
  }

  appToClient() {
    const debug = this.debug;
    const settings = this.settings;

    return async function(ctx, next) {
      debug('enter app request handler');

      try {
        const middlewareTarget = {
          [settings.authenticatorTargetParameter]: 'hub',
        };

        const { body: user, statusCode } = await post(formatURL(ctx), Object.assign({}, ctx.request.body, middlewareTarget));
        debug('hub middleware responded', formatURL(ctx), statusCode, user);

        if ([ACCEPTED, OK].includes(statusCode)) { // ACCEPTED can be used by magic link authenticators, which use a non-HTTP protocal (like Email or other platforms) to deliver the magic link
          if (statusCode === OK) {
            ctx.identityDesk.set({ user });
          }
          ctx.status = SEE_OTHER; // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
          ctx.redirect(settings.successRedirect);
        } else {
          const query = queryString.stringify({ reason: httpCodeMessage[statusCode] });
          ctx.status = SEE_OTHER; // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
          ctx.redirect(`${settings.failureRedirect}?${query}`);
        }
      } catch (error) {
        debug('error when making a POST request to hub middleware', error);
        ctx.throw(error);
      }

    };
  }

  clientToHub() {
    const debug = this.debug;
    const settings = this.settings;

    return async function(ctx, next) {
      debug('enter client request handler');

      try {
        const middlewareTarget = {
          [settings.authenticatorTargetParameter]: 'authenticator',
        };

        const { body: user, statusCode } = await post(formatURL(ctx), Object.assign({}, ctx.request.body, middlewareTarget));
        debug('authenticator middleware responded', formatURL(ctx), statusCode, user);

        // TODO consider storing the login attempt in the DB

        // TODO this is where we need to consider on-boarding and checking links with the master identity
        const name = ctx.path.split('/').pop(); // the authenticator name

        ctx.status = statusCode;
        ctx.body = (statusCode === OK) ? {
          id: 123, // master user ID internal to the hub, not the authenticator user ID // TODO replace with real ID from DB lookup
          [name]: user, // TODO attach linked users from all other authenticators before sending
        } : {};
      } catch (error) {
        debug('error when making a POST request to authenticator middleware', error);
        ctx.throw(error);
      }
    };
  }

  /**
   * Override this with your authenticator route
   * Do not put your authenticator route in the constructor
   */
  hubToAuthenticator() {
    /**
     * Example code:
     * 
     * const debug = this.debug;
     * 
     * return (ctx, next) => {
     *   debug('enter hub request handler');
     * }
     */
  }

};

function post(uri, body) {
  return request({ // unless statusCode is 200, body = {}
    body,
    json: true, // encodes/stringifies the request body as JSON
    method: 'POST',
    resolveWithFullResponse: true, // return more than just the response body
    simple: false, // do not throw on non 2xx HTTP codes
    uri,
  });
}

function formatURL(ctx, query) {

  // Notes

  // debug('ctx.protocol', ctx.protocol);
  // debug('ctx.host', ctx.host);
  // debug('ctx.hostname', ctx.hostname);
  // debug('ctx.path', ctx.path);
  // debug('ctx.originalUrl', ctx.originalUrl);
  // debug('ctx.search', ctx.search);

  // // req.protocol http +10ms
  // // req.host 127.0.0.1:3000 +0ms
  // // req.hostname 127.0.0.1 +1ms // do not use
  // // req.path /auth/local +0ms
  // // req.originalUrl /auth/local?hahaha +1ms // use, immutable and reliable
  // // req.search ?hahaha +1ms
  // // req.query { // use this with originalUrl.split('?')[0]
  // //   hahaha: ''
  // // }

  // discards original query parameters
  // to keep them, make sure to provide them in `query`
  return url.format({
    host: ctx.host,
    pathname: ctx.path,
    protocol: ctx.protocol,
    query,
  });
}