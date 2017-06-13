'use strict';

/**
 * Modules
 */
const express = require('express');
const identityDesk = require('../../');
const path = require('path');

const app = express();
module.exports = app;

// configuration

const CONFIG_PATH = path.resolve(__dirname, '.identity-desk.yml'); // or you can just put .identity-desk.yml/json in your application root folder
process.env.DATABASE_URL = 'sqlite://:memory:';
process.env.SESSION_SECRET = 'my secret';
app.use(identityDesk.express(CONFIG_PATH));

function restrict(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}

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

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}