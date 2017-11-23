'use strict';

/**
 * Modules
 */
const express = require('express');
const path = require('path');

process.env.DEBUG = 'character*';

const Character = require('../../');
const admin = require('../../lib/plugins/admin');
const authentication = require('../../lib/plugins/authentication');

const app = express();
module.exports = app;

// configuration

const CONFIG_PATH = path.resolve(__dirname, 'character.yml');
process.env.DATABASE_URL = 'sqlite://:memory:';
process.env.SESSION_COOKIE_MAXAGE = 7 * 24 * 60 * 60 * 1000;
process.env.SESSION_KEYS = ['secret key 1', 'secret key 2'];

const character = Character({
  config: CONFIG_PATH, // or you can just put character.yml/json in your application root folder
  plugins: [admin, authentication],
});

app.use(character.app);

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

app.get('/register', function(req, res) {
  res.sendFile(path.resolve(__dirname, 'register.html'));
});

const server = app.listen();
console.log(`Express started on port ${server.address().port}`);

character.events.on('authentication:onboard', console.log.bind(console));
character.events.on('authentication:authenticate', console.log.bind(console));

if (module.parent) {
  module.exports = { character, port: server.address().port, server };
} else {
  character.database.init().then(() => console.log('Database initialized'));
}
