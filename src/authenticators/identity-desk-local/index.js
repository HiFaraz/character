'use strict';

/**
 * Module dependencies.
 */
import { INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from 'http-codes';
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
        // purposely send a status of `UNAUTHORIZED`, even if user does not exist
        return res.sendStatus(UNAUTHORIZED);
      }
    }

    /**
     * Define extra authenticator routes
     */
    extend() {
      // Registration route
      this.router.post('/register', async (req, res, next) => {
        try {
          const { User } = this.models;
          const { password, username } = req.body;

          const result = await User.create({ password, username });
          if (result.status === OK) {
            await this.onboard({ id: result.id }); // create a new core identity
            // TODO add optional logic (based on config) to immediately login the user with req.login()
            return res.status(OK).send({ id: result.id });
          } else {
            return res.sendStatus(result.status);
          }
        } catch (error) {
          next(error);
        }
      });
    }

    static models() {
      return models;
    }
  };
};
