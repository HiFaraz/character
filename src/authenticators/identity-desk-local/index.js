'use strict';

/**
 * Module dependencies.
 */
import { INTERNAL_SERVER_ERROR, OK, SEE_OTHER, UNAUTHORIZED } from 'http-codes';
import models from './models';

module.exports = function({ CorePOSTAuthenticator }) {
  return class LocalAuthenticator extends CorePOSTAuthenticator {
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
    async authenticate(req, res, next) {
      // errors are handled upstream by the Authentication plugin
      const { User } = this.models;
      const { username, password } = req.body;
      const result = await User.authenticate(username, password);

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
            const { User } = this.models;
            const { password, username } = req.body;

            const result = await User.create({ password, username });
            if (result.status === OK) {
              // onboard the new user account as a core identity
              const identity = await this.onboard({ id: result.id }); // create a new core identity

              // login the user if enabled
              if (this.config.loginAfterRegistration) {
                req.login({
                  authenticator: {
                    account: { id: result.id },
                    name: this.name,
                  },
                  id: identity.id,
                });
              }

              return res.redirect(SEE_OTHER, this.config.registrationRedirect); // SEE OTHER (303) is the spec for a GET redirect from a POST request, though most browsers allow FOUND (302) as well (technically this is not allowed)
            } else {
              return res.sendStatus(result.status);
            }
          } catch (error) {
            next(error);
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
