'use strict';

/**
 * Module dependencies.
 */
import { INTERNAL_SERVER_ERROR, NOT_FOUND, SEE_OTHER } from 'http-codes';
import CoreGenericAuthenticator from './generic';
import asyncpipe from 'asyncpipe';
import { STATUS_CODES as httpCodeMessage } from 'http';
import queryString from 'querystring';

module.exports = class CorePOSTAuthenticator extends CoreGenericAuthenticator {
  /**
   * Handle requests from the application to the client
   *
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   * @return {Promise<Object>}
   */
  async receiver(req, res) {
    try {
      this.debug('enter app request handler');

      return await asyncpipe(
        context => this.authenticate(context),
        context => this.identify(context),
        // login the user by creating a session
        context => {
          if (!context.user.deferred) {
            // deferred can be used by magic link authenticators, which use a non-HTTP protocol (e.g. email) to deliver the magic link
            req.character.set({ user: context.user });
          }
          return context;
        },
        // redirect the user
        context =>
          context.res.redirect(
            SEE_OTHER,
            context.user.deferred
              ? this.config.deferredRedirect
              : this.config.successRedirect,
          ),
      )({ req, res });
    } catch (error) {
      this.debug('error authenticating', error);
      const query = queryString.stringify({
        reason: httpCodeMessage[error.httpStatusCode || INTERNAL_SERVER_ERROR],
      });
      return res.redirect(SEE_OTHER, `${this.config.failureRedirect}?${query}`);
    }
  }

  /**
   * Handles requests from the client to the authenticator
   *
   * Override this with a function to define an authenticator route
   *
   * @param {Object} context
   * @param {IncomingMessage} context.req
   * @param {ServerResponse} context.res
   * @return {Promise<Object>}
   */
  authenticate({ req, res }) {
    /**
     * Example code:
     *
     * return { id: ... };
     */
    return true;
  }

  /**
   * Define core routes
   */
  define() {
    // binding functions have been known to be slow in older JavaScript runtimes
    // this may be an optimization target
    this.router.post('/', this.deps.session, this.receiver.bind(this));
  }

  /**
   * Identity or onboard the authenticator account
   *
   * @param {Object} context
   * @param {Object} context.account
   * @param {IncomingMessage} context.req
   * @param {ServerResponse} context.res
   * @return {Promise<Object>}
   */
  async identify({ account, req, res }) {
    this.debug('got account', account);

    const user = {
      authenticator: {
        account,
        name: this.name,
      },
    };

    if (account.deferred) {
      user.deferred = true;
    } else {
      // TODO if the user is already logged in, consider linking the authenticator account to the logged in core identity instead of creating a new core identity
      const identity = await this.findIdentity(account);

      // `account` is the user record with the authenticator (local or external identity provider)
      // `identity` is the user record with Character

      if (identity) {
        // return the minimum to record successful authentication, rest can be queried by applications later
        user.id = identity.id;
      } else if (this.config.onboardKnownAccounts) {
        // onboard the user by creating a core identity
        const newIdentity = await this.onboard(account);
        user.id = newIdentity.id;
      } else {
        // only accept recognized core identities
        const error = new Error('Could not find identity for account');
        error.httpStatusCode = NOT_FOUND;
        throw error;
      }
    }
    this.events.emit('authentication:authenticate', {
      datetime: new Date(),
      user,
    });
    return { req, res, user };
  }
};
