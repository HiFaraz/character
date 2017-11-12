'use strict';

/**
 * Module dependencies.
 */
import { INTERNAL_SERVER_ERROR, OK, SEE_OTHER, UNAUTHORIZED } from 'http-codes';
import asyncpipe from 'asyncpipe';
import models from './models';

module.exports = function({ CorePOSTAuthenticator }) {
  return class LocalAuthenticator extends CorePOSTAuthenticator {
    /**
     * Handles requests from the hub to the authenticator
     * 
     * @param {IncomingMessage} req 
     * @param {ServerResponse} res 
     * @param {Function} next 
     * @return {Promise<Object>}
    */
    async authenticate(req, res, next) {
      // errors are handled upstream by the Authentication plugin
      const result = await this.models.User.authenticate(
        req.body.username,
        req.body.password,
      );

      if (result.status === OK) {
        return res.status(OK).send({ id: result.id });
      } else if (result.status === INTERNAL_SERVER_ERROR) {
        res.sendStatus(INTERNAL_SERVER_ERROR);
      } else {
        // `result.status` may be `NOT_FOUND` and `UNAUTHORIZED`

        /**
         * Send a status of `UNAUTHORIZED` instead of `NOT_FOUND`, even if user
         * does not exist
         * 
         * 
         * This is **NOT** a fool-proof security measure because other parts of
         * the application may reveal whether a username exists, such as a
         * sign-up page or public profile page
         */

        return res.sendStatus(UNAUTHORIZED);
      }
    }

    /**
     * Define extra authenticator routes
     */
    extend() {
      // Add open registration route if enabled
      if (this.config.registrationOpen) {
        const registrationPath = '/register';

        // session middleware needed if login after registration enabled
        if (this.config.loginAfterRegistration) {
          this.router.post(registrationPath, this.dependencies.session);
        }

        // add registration middleware
        this.router.post(registrationPath, async (req, res, next) => {
          try {
            await asyncpipe(register, onboard, login, () =>
              res.redirect(
                SEE_OTHER,
                this.config.registrationRedirect || this.config.successRedirect,
              ),
            )({
              User: this.models.User,
              authenticator: this,
              req,
              res,
            });
          } catch (error) {
            return res.redirect(
              SEE_OTHER,
              this.config.registrationFailureRedirect ||
                this.config.failureRedirect,
            );
          }
        });
      }
    }

    static defaults() {
      return {
        loginAfterRegistration: true,
        registrationOpen: true,
      };
    }

    static models() {
      return models;
    }
  };
};

/**
 * Login the user after registration if enabled
 * 
 * @param {Object} context 
 * @return {Promise<Object>}
 */
async function login(context) {
  // login the user if enabled
  if (context.authenticator.config.loginAfterRegistration) {
    context.req.login({
      authenticator: {
        account: { id: context.result.id },
        name: context.authenticator.name,
      },
      id: context.identity.id,
    });
  }
  return context;
}

/**
 * Onboard the authenticator account by creating a new core identity
 * 
 * @param {Object} context 
 * @return {Promise<Object>}
 */
async function onboard(context) {
  const identity = await context.authenticator.onboard({
    id: context.result.id,
  }); // create a new core identity
  return Object.assign({ identity }, context);
}

/**
 * Register username and password
 * 
 * @param {Object} context 
 * @return {Promise<Object>}
 */
async function register(context) {
  const result = await context.User.create({
    password: context.req.body.password,
    username: context.req.body.username,
  });
  return Object.assign({ result }, context);
}
