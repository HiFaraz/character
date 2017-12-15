'use strict';

import express, { Router } from 'express';
import { createApp } from './framework';
import request from 'supertest';

describe('Framework', () => {
  it('loads a plugin', () => {
    // define a plugin
    const router = Router();
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
      .get(`/id${plugin.config.base}/endpoint`)
      .expect(200);
  });
});
