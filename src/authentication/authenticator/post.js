'use strict';

/**
 * Module dependencies.
 */
import { ACCEPTED, INTERNAL_SERVER_ERROR, OK, SEE_OTHER } from 'http-codes';
import CoreGenericAuthenticator from './core';
import { STATUS_CODES as httpCodeMessage } from 'http';
import queryString from 'querystring';
import request from 'request-promise';
import url from 'url';

module.exports = class CorePOSTAuthenticator extends CoreGenericAuthenticator {
  /**
     * Returns a middleware that handles requests from the application to the client
     * 
     * @return {Function}
     */
  appToClient() {
    return async (req, res, next) => {
      this.debug('enter app request handler');

      try {
        const middlewareTarget = {
          [this.config.authenticatorTargetParameter]: 'hub',
        };

        const { body: user, statusCode } = await post(
          formatURL(req),
          Object.assign({}, req.body, middlewareTarget),
        );
        this.debug(
          'hub middleware responded',
          formatURL(req),
          statusCode,
          user,
        );

        if ([ACCEPTED, OK].includes(statusCode)) {
          // ACCEPTED can be used by magic link authenticators, which use a non-HTTP protocal (like Email or other platforms) to deliver the magic link
          if (statusCode === OK) {
            req.identityDesk.set({ user });
          }
          res.redirect(SEE_OTHER, this.config.successRedirect); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
        } else {
          const query = queryString.stringify({
            reason: httpCodeMessage[statusCode],
          });
          res.redirect(SEE_OTHER, `${this.config.failureRedirect}?${query}`); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
        }
      } catch (error) {
        this.debug('error when making a POST request to hub middleware', error);
        next(error);
      }
    };
  }

  /**
     * Returns a middleware that handles requests from the client to the hub
     * 
     * @return {Function}
     */
  clientToHub() {
    return async (req, res, next) => {
      this.debug('enter client request handler');

      try {
        const middlewareTarget = {
          [this.config.authenticatorTargetParameter]: 'authenticator',
        };

        const { body: account, statusCode } = await post(
          formatURL(req),
          Object.assign({}, req.body, middlewareTarget),
        );
        this.debug(
          'authenticator middleware responded',
          formatURL(req),
          statusCode,
          account,
        );

        // TODO consider storing the login attempt in the DB

        // TODO this is where we need to consider on-boarding and checking links with the master identity

        const {
          Authentication$Account,
          Core$Identity,
        } = this.dependencies.database.models;

        const identity = await Core$Identity.findOne({
          attributes: ['id'],
          include: [
            {
              attributes: [],
              model: Authentication$Account,
              where: {
                authenticatorAccountId: account.id, // authenticator must return an id
                authenticatorName: this.name,
              },
            },
          ],
          raw: true,
        });

        // return the minimum to record successful authentication, rest can be queried by applications later
        res.status(statusCode).json(
          statusCode === OK
            ? {
                authenticator: { account, name: this.name },
                id: identity.id, // master user ID internal to the hub, not the authenticator user ID // TODO replace with real ID from DB lookup
              }
            : {},
        );
      } catch (error) {
        this.debug(
          'error when making a POST request to authenticator middleware',
          error,
        );
        next(error);
      }
    };
  }

  /**
     * Define generic routes
     */
  define() {
    this.router.post(
      '/',
      async (req, res, next) => {
        this.debug('new request', req.path, req.body);
        const middleware = {
          authenticator: () => async (req, res, next) => {
            this.debug('enter hub request handler');
            try {
              return await this.hubToAuthenticator()(req, res, next);
            } catch (error) {
              const message = `error when running authenticator middleware for authenticator \`${this
                .name}\``;
              this.debug(message, error.message);
              res.status(INTERNAL_SERVER_ERROR).send(message);
            }
          },
          hub: this.clientToHub.bind(this),
        }[req.body[this.config.authenticatorTargetParameter]];
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

  /**
     * Returns a middleware that handles requests from the hub to the authenticator
     * 
     * Override this with a function to define an authenticator route
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

/**
 * Send a POST request
 * 
 * @param {string} uri 
 * @param {Object} body 
 * @return {Object}
 */
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

/**
 * Format a URL
 * 
 * @param {IncomingMessage} req 
 * @param {Object} query 
 * @return {string}
 */
function formatURL(req, query) {
  // discards original query parameters
  // to keep them, make sure to provide them in `query`
  return url.format({
    host: req.headers.host,
    pathname: req.originalUrl.split('?')[0],
    protocol: req.protocol,
    query,
  });
}
