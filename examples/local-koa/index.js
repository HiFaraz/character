'use strict';

/**
 * Modules
 */
const Koa = require('koa');
const Router = require('koa-router');
const path = require('path');

process.env.DEBUG = 'identity-desk*';

const IdentityDesk = require('../../lib');
const framework = require('../../lib/frameworks/koa');
const authentication = require('../../lib/authentication');

const app = new Koa();
const router = new Router();
module.exports = app;

// configuration

const CONFIG_PATH = path.resolve(__dirname, '.identity-desk.yml');
process.env.DATABASE_URL = 'sqlite://:memory:';
process.env.SESSION_SECRET = 'my secret';

const identityDesk = new IdentityDesk({
  config: CONFIG_PATH, // or you can just put .identity-desk.yml/json in your application root folder
  framework,
  plugins: [
    authentication,
  ],
});

app.use(identityDesk.app());

async function restrict(ctx, next) {
  if (ctx.isAuthenticated()) {
    await next();
  } else {
    ctx.redirect('/login');
  }
}

router.get('/', async function(ctx, next) {
  ctx.redirect('/login');
});

router.get('/restricted', restrict, async function(ctx, next) {
  ctx.body = 'Wahoo! restricted area, click to <a href="/logout">logout</a>';
  await next();
});

router.get('/logout', async function(ctx, next) {
  ctx.logout();
});

router.get('/login', async function(ctx, next) {
  ctx.body = `<!DOCTYPE html>
<html>

<head>
  <title>Local authentication example</title>
</head>

<body>
  Try accessing <a href="/restricted">/restricted</a>, then authenticate with "foo" and "bar".
  <form method="post" action="/auth/local">
    <input type="hidden" name="callback" value="/restricted">

    <p>
      <label for="username">Username:</label>
      <input type="text" name="username" placeholder="foo">
    </p>
    <p>
      <label for="password">Password:</label>
      <input type="password" name="password" placeholder="bar">
    </p>
    <p>
      <input type="submit" value="Login">
    </p>
  </form>
</body>

</html>`;
});

app.use(router.routes());
app.use(router.allowedMethods());

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Koa started on port 3000');
}