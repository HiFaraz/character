'use strict';

/**
 * Module dependencies.
 */
import { OK, UNAUTHORIZED } from 'http-codes';
import models from './models';

module.exports = function({ CorePOSTAuthenticator }) {
  return class LocalAuthenticator extends CorePOSTAuthenticator {
    hubToAuthenticator() {
      return async (req, res, next) => {
        try {
          const { username, password } = req.body;
          this.debug(
            `authenticating username ${username} and password ${password}`,
          );

          const { User } = this.models;

          const result = await User.authenticate(username, password);

          if (result.status === OK) {
            res.send({ id: result.id });
          } else {
            // `result.status` may be `NOT_FOUND` and `UNAUTHORIZED`
            // purposely send a status of `UNAUTHORIZED`, even if user does not exist
            res.sendStatus(UNAUTHORIZED);
          }
        } catch (error) {
          this.debug('error within local authenticator', error);
          throw error;
        }
      };
    }

    static models() {
      return models;
    }
  };
};
