'use strict';

/**
 * Module dependencies.
 */
import { SEE_OTHER } from 'http-codes';
import asyncpipe from 'asyncpipe';
import models from './models';

module.exports = function({ CorePOSTAuthenticator }) {
  return class LocalAuthenticator extends CorePOSTAuthenticator {
    /**
     * Handles requests from the hub to the authenticator
     * 
     * @param {Object} context
     * @param {IncomingMessage} context.req 
     * @param {ServerResponse} context.res 
     * @return {Promise<Object>}
    */
    async authenticate({ req, res }) {
      // errors are handled upstream by the Authentication plugin
      return {
        account: await this.models.User.authenticate(
          req.body.username,
          req.body.password,
        ),
        req,
        res,
      };
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
