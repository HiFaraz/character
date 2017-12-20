'use strict';

const express = require('express');
const { createApp } = require('../lib/framework');
const request = require('supertest');

describe('Framework', () => {
  it('loads a plugin', () => {
    // define a plugin
    const router = express.Router();
    router.get('/endpoint', (req, res) => res.sendStatus(200));
    const plugin = {
      config: {
        base: '/plugin',
      },
      postRouterMiddleware: [],
      preRouterMiddleware: [],
      router,
    };

    const app = express();
    app.use(createApp({}, [plugin]));

    return request(app)
      .get(`/char${plugin.config.base}/endpoint`)
      .expect(200);
  });
});
