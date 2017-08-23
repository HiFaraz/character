'use strict';

/**
 * Module dependencies.
 */
import { UNAUTHORIZED } from 'http-codes';

module.exports = function({ CorePOSTAuthenticator }) {
  return class MockLocalAuthenticator extends CorePOSTAuthenticator {
    authenticate(req, res, next) {
      const { username, password } = req.body;
      this.debug(
        `authenticating username ${username} and password ${password}`,
      );

      // Mock authentication code
      if (username === 'foo' && password === 'bar') {
        res.send({ id: 1 });
      } else {
        res.sendStatus(UNAUTHORIZED);
      }
    }
  };
};
