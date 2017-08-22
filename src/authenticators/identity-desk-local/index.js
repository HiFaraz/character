'use strict';

/**
 * Module dependencies.
 */

import { UNAUTHORIZED } from 'http-codes';
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

          const user = await User.findOne({
            attributes: ['id', 'password'],
            raw: true,
            where: { username },
          });

          if (user) {
            // Mock authentication code
            // TODO replace with bcrypt
            if (password === user.password) {
              // success
              res.send({ id: user.id });
            } else {
              // bad password
              res.sendStatus(UNAUTHORIZED);
            }
          } else {
            // user not found
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
