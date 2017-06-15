'use strict';

export default {
  extend,
};

/**
 * Extends the request objects
 *
 * @param {Object} ctx
 * @param {function} next
 */
function extend(ctx, next) {
  ctx.req.isAuthenticated = () => (ctx.session && ctx.session.identityDesk && ctx.session.identityDesk.user) ? true : false;
  ctx.isAuthenticated = ctx.req.isAuthenticated;

  ctx.req.isUnauthenticated = () => !ctx.req.isAuthenticated();
  ctx.isUnauthenticated = ctx.req.isUnauthenticated;

  // TODO implement req.login/req.logIn?
  ctx.req.logout = () => {
    ctx.session = null;
    ctx.res.redirect('/');
  };
  ctx.req.logOut = ctx.req.logout;
  ctx.logout = ctx.req.logout;
  ctx.logOut = ctx.req.logOut;
}