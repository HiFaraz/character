/**
 * Based on https://github.com/expressjs/express/blob/9f019c8c6966736803a65eb4a96d0e7e87e85ede/test/acceptance/auth.js
 */
'use strict';

import identityDesk from '../../examples/mock-local';
import request from 'supertest';

/**
 * Create a Cookie header value from a request's `Set-Cookie` header
 * 
 * @param {IncomingMessage} res 
 * @return {string}
 */
function getCookies(res) {
  return (res.headers['set-cookie'] || [])
    .map(cookie => cookie.split(';')[0])
    .join('; ');
}

describe('mock-local', function() {
  before(async () => {
    await identityDesk.database.init();

    const {
      Authentication$Account,
      Core$Identity,
    } = identityDesk.database.models;

    // set up test identity and authentication account
    await Core$Identity.create(
      {
        authentication$Accounts: [
          {
            authenticatorAccountId: 1,
            authenticatorName: 'mock-local',
          },
        ],
      },
      {
        include: [Authentication$Account],
      },
    );
  });

  describe('GET /', function() {
    it('should redirect to /login', function(done) {
      request('http://localhost:3000')
        .get('/')
        .expect('Location', '/login')
        .expect(302, done);
    });
  });

  describe('GET /login', function() {
    it('should render login form', function(done) {
      request('http://localhost:3000').get('/login').expect(200, /<form/, done);
    });

    it('should display login error', function(done) {
      request('http://localhost:3000')
        .post('/auth/mock-local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });
  });

  describe('GET /logout', function() {
    it('should redirect to /', function(done) {
      request('http://localhost:3000')
        .get('/logout')
        .expect('Location', '/')
        .expect(302, done);
    });
  });

  describe('GET /restricted', function() {
    it('should redirect to /login without cookie', function(done) {
      request('http://localhost:3000')
        .get('/restricted')
        .expect('Location', '/login')
        .expect(302, done);
    });

    it('should succeed with proper cookie', function(done) {
      request('http://localhost:3000')
        .post('/auth/mock-local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/restricted')
        .expect(303, function(err, res) {
          if (err) {
            return done(err);
          }
          request('http://localhost:3000')
            .get('/restricted')
            .set('Cookie', getCookies(res))
            .expect(200, done);
        });
    });
  });

  describe('POST /auth/mock-local', function() {
    it('should fail without proper username', function(done) {
      request('http://localhost:3000')
        .post('/auth/mock-local')
        .type('urlencoded')
        .send('username=not-foo&password=bar')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });

    it('should fail without proper password', function(done) {
      request('http://localhost:3000')
        .post('/auth/mock-local')
        .type('urlencoded')
        .send('username=foo&password=baz')
        .expect('Location', '/login?reason=Unauthorized')
        .expect(303, done);
    });

    it('should succeed with proper credentials', function(done) {
      request('http://localhost:3000')
        .post('/auth/mock-local')
        .type('urlencoded')
        .send('username=foo&password=bar')
        .expect('Location', '/restricted')
        .expect(303, done);
    });
  });
});
