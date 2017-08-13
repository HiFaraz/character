'use strict';

export default {
  extend,
};

/**
 * Extends the request objects
 *
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {function} next
 * @return {Promise}
 */
function extend(req, res, next) {
  req.isAuthenticated = () => (req.identityDesk.get('user') ? true : false);

  req.isUnauthenticated = () => !req.isAuthenticated();

  // TODO implement req.login/req.logIn?

  req.logout = () => {
    req.session.destroy();
    res.redirect('/');
  };
  req.logOut = req.logout;

  return next();
}
