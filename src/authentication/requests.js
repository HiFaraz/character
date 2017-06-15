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
    if (ctx.res.redirect) {
      ctx.res.redirect('/'); // required for apps using `CoreFramework#expressify`, such as Express apps
    } else {
      ctx.redirect('/'); // required for Koa-like apps
    }
  };
  ctx.req.logOut = ctx.req.logout;
  ctx.logout = ctx.req.logout;
  ctx.logOut = ctx.req.logOut;

  next();
}