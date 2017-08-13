'use strict';

/**
 * Module dependencies.
 */

import { UNAUTHORIZED } from 'http-codes';

module.exports = function({ CorePOSTAuthenticator }) {
  return class MockLocalAuthenticator extends CorePOSTAuthenticator {
    hubToAuthenticator() {
      const debug = this.debug;

      return (req, res, next) => {
        const { username, password } = req.body;
        debug(`authenticating username ${username} and password ${password}`);

        // Mock authentication code
        if (username === 'foo' && password === 'bar') {
          res.send(username); // TODO wrap in JSON for security?
        } else {
          res.sendStatus(UNAUTHORIZED);
        }
      };
    }
  };
};
