/**
 * Extend requests
 *
 * @module
 */
'use strict';

export default {
  extend,
};

/**
 * Extends the request objects in an Express app
 *
 * @param {Object} app Express app
 * @alias module:frameworks/express/lib/requests.extend
 */
function extend(app) {
  app.use((req, res, next) => {
    // if (!req.session.identityDesk) req.session.identityDesk = {};
    req.isAuthenticated = () => (req.session && req.session.identityDesk && req.session.identityDesk.user) ? true : false;
    req.isUnauthenticated = () => !req.isAuthenticated();
    // TODO implement req.login/req.logIn?
    req.logout = () => {
      // if (req.session && req.session.identityDesk && req.session.identityDesk.user) {
      //   req.session.identityDesk.user = null;
      // }

      // or destroy the session as per the express examples?
      // destroy the user's session to log them out
      // will be re-created next request
      req.session.destroy(function() {
        res.redirect('/');
      });
    };
    req.logOut = req.logout;
    next();
  });
}