'use strict';

/**
 * Module dependencies.
 */
import {
  ACCEPTED,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
  SEE_OTHER,
} from 'http-codes';
import CoreGenericAuthenticator from './generic';
import { STATUS_CODES as httpCodeMessage } from 'http';
import queryString from 'querystring';
import request from 'request-promise';
import url from 'url';

module.exports = class CorePOSTAuthenticator extends CoreGenericAuthenticator {
  /**
   * Handle requests from the application to the client
   * 
   * @param {IncomingMessage} req 
   * @param {ServerResponse} res 
   * @param {Function} next 
   * @return {Promise<Object>}
   */
  async appToClient(req, res, next) {
    try {
      this.debug('enter app request handler');
      const middlewareTarget = {
        [this.config.authenticatorTargetParameter]: 'hub',
      };

      const { body: user, statusCode } = await specialPOST(
        req,
        middlewareTarget,
      );

      this.debug('hub middleware responded', formatURL(req), statusCode, user);

      if ([ACCEPTED, OK].includes(statusCode)) {
        // ACCEPTED can be used by magic link authenticators, which use a non-HTTP protocol (like Email or other platforms) to deliver the magic link
        if (statusCode === OK) {
          req.identityDesk.set({ user });
        }
        return res.redirect(SEE_OTHER, this.config.successRedirect); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
      } else {
        const query = queryString.stringify({
          reason: httpCodeMessage[statusCode],
        });
        return res.redirect(
          SEE_OTHER,
          `${this.config.failureRedirect}?${query}`,
        ); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
      }
    } catch (error) {
      this.debug('error handling request from app to client', error);
      next(error);
    }
  }

  /**
   * Handles requests from the hub to the authenticator
   * 
   * Override this with a function to define an authenticator route
   * 
   * @param {IncomingMessage} req 
   * @param {ServerResponse} res 
   * @param {Function} next 
   * @return {Promise<Object>}
   */
  authenticate(req, res, next) {
    /**
     * Example code:
     *
     * res.status(200).send({id: ...});
     */
    return true;
  }

  /**
   * Handle requests from the client to the hub
   * 
   * @param {IncomingMessage} req 
   * @param {ServerResponse} res 
   * @param {Function} next 
   * @return {Promise<Object>}
   */
  async clientToHub(req, res, next) {
    try {
      this.debug('enter client request handler');
      const middlewareTarget = {
        [this.config.authenticatorTargetParameter]: 'authenticator',
      };

      const { body: account, statusCode } = await specialPOST(
        req,
        middlewareTarget,
      );
      this.debug(
        'authenticator middleware responded',
        formatURL(req),
        statusCode,
        account,
      );

      if (statusCode === OK) {
        // TODO if the user is already logged in, consider linking the authenticator account to the logged in core identity instead of creating a new core identity
        const identity = await this.identify(account);

        // `account` is the user record with the authenticator (local or external identity provider)
        // `identity` is the user record with Identity Desk

        if (identity) {
          // return the minimum to record successful authentication, rest can be queried by applications later
          return res.status(OK).json({
            authenticator: { account, name: this.name },
            id: identity.id,
          });
        } else if (this.config.onboardKnownAccounts) {
          // onboard the user by creating a core identity
          const newIdentity = await this.onboard(account);
          return res.status(OK).json({
            authenticator: { account, name: this.name },
            id: newIdentity.id,
          });
        } else {
          // only accept recognized core identities
          res.sendStatus(NOT_FOUND);
        }
      } else {
        res.sendStatus(statusCode);
      }

      // TODO consider storing the login attempt in the DB, maybe emit an event on identityDesk for the Audit plugin to listen to
    } catch (error) {
      this.debug('error when handling request from client to hub', error);
      next(error);
    }
  }

  /**
   * Define core routes
   */
  define() {
    // binding functions have been known to be slow in older JavaScript runtimes
    // this may be an optimization target
    this.router.post(
      '/',
      (req, res, next) => {
        this.debug('new request', req.path, req.body);
        const middleware = {
          authenticator: this.hubToAuthenticator,
          hub: this.clientToHub,
        }[req.body[this.config.authenticatorTargetParameter]];
        if (middleware) {
          return middleware.call(this, req, res, next);
        } else {
          return next();
        }
      },
      this.dependencies.session,
      this.appToClient.bind(this),
    );
  }

  /**
   * Pass requests from the hub to the authenticator
   * 
   * @param {IncomingMessage} req 
   * @param {ServerResponse} res 
   * @param {Function} next 
   * @return {Promise<Object>}
   */
  async hubToAuthenticator(req, res, next) {
    try {
      this.debug('enter hub request handler');
      return await this.authenticate(req, res, next);
    } catch (error) {
      const message = `error when handling request from hub to authenticator \`${this
        .name}\``;
      this.debug(message, error.message);
      res.status(INTERNAL_SERVER_ERROR).send(message);
    }
  }
};

/**
 * Special wrapper for the generic `post` method
 * 
 * @param {IncomingMessage} req 
 * @param {string} target 
 * @return {Promise<Object>}
 */
function specialPOST(req, target) {
  return post(formatURL(req), Object.assign({}, req.body, target));
}

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
