'use strict';

/**
 * Module dependencies.
 */

import { ACCEPTED, OK, SEE_OTHER } from 'http-codes';
import { Router } from 'express';
import { clone } from 'lodash';
import { STATUS_CODES as httpCodeMessage } from 'http';
import queryString from 'querystring';
import request from 'request-promise';
import url from 'url';

module.exports = class CorePOSTAuthenticator {
  /**
   * @param {string} name
   * @param {Object} config
   * @param {Object} dependencies
   */
  constructor(name, config, dependencies) {
    this.debug = require('debug')(
      `identity-desk:authentication:authenticator:${name}`,
    );
    this.dependencies = dependencies;
    this.name = name;
    this.router = Router();
    this.config = clone(config);

    this.debug('initializing');

    this.router.post(
      '/',
      async (req, res, next) => {
        this.debug('new request', req.path, req.body);
        const middleware = {
          authenticator: () => (req, res, next) => {
            this.debug('enter hub request handler');
            return this.hubToAuthenticator()(req, res, next);
          },
          hub: this.clientToHub.bind(this),
        }[req.body[config.authenticatorTargetParameter]];
        if (middleware) {
          return middleware()(req, res, next);
        } else {
          return next();
        }
      },
      this.dependencies.session,
      this.appToClient(),
    );
  }

  appToClient() {
    const debug = this.debug;
    const config = this.config;

    return async function(req, res, next) {
      debug('enter app request handler');

      try {
        const middlewareTarget = {
          [config.authenticatorTargetParameter]: 'hub',
        };

        const { body: user, statusCode } = await post(
          formatURL(req),
          Object.assign({}, req.body, middlewareTarget),
        );
        debug('hub middleware responded', formatURL(req), statusCode, user);

        if ([ACCEPTED, OK].includes(statusCode)) {
          // ACCEPTED can be used by magic link authenticators, which use a non-HTTP protocal (like Email or other platforms) to deliver the magic link
          if (statusCode === OK) {
            req.identityDesk.set({ user });
          }
          res.redirect(SEE_OTHER, config.successRedirect); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
        } else {
          const query = queryString.stringify({
            reason: httpCodeMessage[statusCode],
          });
          res.redirect(SEE_OTHER, `${config.failureRedirect}?${query}`); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
        }
      } catch (error) {
        debug('error when making a POST request to hub middleware', error);
        next(error);
      }
    };
  }

  clientToHub() {
    const debug = this.debug;
    const config = this.config;

    return async function(req, res, next) {
      debug('enter client request handler');

      try {
        const middlewareTarget = {
          [config.authenticatorTargetParameter]: 'authenticator',
        };

        const { body: user, statusCode } = await post(
          formatURL(req),
          Object.assign({}, req.body, middlewareTarget),
        );
        debug(
          'authenticator middleware responded',
          formatURL(req),
          statusCode,
          user,
        );

        // TODO consider storing the login attempt in the DB

        // TODO this is where we need to consider on-boarding and checking links with the master identity
        const name = req.path.split('/').pop(); // the authenticator name

        res.status(statusCode).json(
          statusCode === OK
            ? {
                id: 123, // master user ID internal to the hub, not the authenticator user ID // TODO replace with real ID from DB lookup
                [name]: user, // TODO attach linked users from all other authenticators before sending
              }
            : {},
        );
      } catch (error) {
        debug(
          'error when making a POST request to authenticator middleware',
          error,
        );
        next(error);
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
     * return (req, res, next) => {
     *   
     * }
     */
  }
};

function post(uri, body) {
  return request({
    // unless statusCode is 200, body = {}
    body,
    json: true, // encodes/stringifies the request body as JSON
    method: 'POST',
    resolveWithFullResponse: true, // return more than just the response body
    simple: false, // do not throw on non 2xx HTTP codes
    uri,
  });
}

function formatURL(req, query) {
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
    host: req.headers.host,
    pathname: req.originalUrl.split('?')[0],
    protocol: req.protocol,
    query,
  });
}
