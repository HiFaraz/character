'use strict';

/**
 * Modules
 */
const express = require('express');
const path = require('path');

process.env.DEBUG = 'identity-desk*';

const IdentityDesk = require('../../lib');
const authentication = require('../../lib/authentication');

const app = express();
module.exports = app;

// configuration

const CONFIG_PATH = path.resolve(__dirname, 'identity-desk.yml');
process.env.DATABASE_URL = 'sqlite://:memory:';
process.env.SESSION_COOKIE_MAXAGE = 7 * 24 * 60 * 60 * 1000;
process.env.SESSION_KEYS = ['secret key 1', 'secret key 2'];

const identityDesk = IdentityDesk({
  config: CONFIG_PATH, // or you can just put identity-desk.yml/json in your application root folder
  plugins: [authentication],
});

app.use(identityDesk.app);

const restrict = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', function(req, res) {
  res.redirect('/login');
});

app.get('/restricted', restrict, function(req, res) {
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/logout', function(req, res) {
  req.logout();
});

app.get('/login', function(req, res) {
  res.sendFile(path.resolve(__dirname, 'login.html'));
});

app.post('/register', function(req, res) {
  res.redirect('/auth/local/register');
});

const server = app.listen();
console.log(`Express started on port ${server.address().port}`);

if (module.parent) {
  module.exports = { identityDesk, port: server.address().port };
}
