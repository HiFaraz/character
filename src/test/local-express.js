/**
 * Based on https://github.com/expressjs/express/blob/9f019c8c6966736803a65eb4a96d0e7e87e85ede/test/acceptance/auth.js
 */
'use strict';

import app from '../../examples/local-express';
import request from 'supertest';

function getCookie(res) {
  return res.headers['set-cookie'][0].split(';')[0];
}

describe('local-express', function() {
  describe('GET /', function() {
    it('should redirect to /login', function(done) {
      request(app)
        .get('/')
        .expect('Location', '/login')
        .expect(302, done);
    });
  });

  describe('GET /login', function() {
    it('should render login form', function(done) {
      request(app)
        .get('/login')
        .expect(200, /<form/, done);
    });

    it('should display login error', function(done) {
      request(app)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login')
        .expect(302, function(err, res) {
          if (err) { return done(err); }
          request(app)
            .get('/login')
            .set('Cookie', getCookie(res))
            .expect(200, /Authentication failed/, done);
        });
    });
  });

  describe('GET /logout', function() {
    it('should redirect to /', function(done) {
      request(app)
        .get('/logout')
        .expect('Location', '/')
        .expect(302, done);
    });
  });

  describe('GET /restricted', function() {
    it('should redirect to /login without cookie', function(done) {
      request(app)
        .get('/restricted')
        .expect('Location', '/login')
        .expect(302, done);
    });

    it('should succeed with proper cookie', function(done) {
      request(app)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/')
        .expect(302, function(err, res) {
          if (err) { return done(err); }
          request(app)
            .get('/restricted')
            .set('Cookie', getCookie(res))
            .expect(200, done);
        });
    });
  });

  describe('POST /login', function() {
    it('should fail without proper username', function(done) {
      request(app)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login')
        .expect(302, done);
    });

    it('should fail without proper password', function(done) {
      request(app)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=baz')
        .expect('Location', '/login')
        .expect(302, done);
    });

    it('should succeed with proper credentials', function(done) {
      request(app)
        .post('/auth/local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/')
        .expect(302, done);
    });
  });
});