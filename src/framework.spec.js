'use strict';

import express, { Router } from 'express';
import Framework from './framework';
import assert from 'assert';
import request from 'supertest';

describe('Framework class', () => {
  it('provides config defaults', () => {
    assert(Framework.defaults);
    assert(typeof Framework.defaults === 'function');
    assert(typeof Framework.defaults() === 'object');
  });

  it('provides a config validator', () => {
    assert(Framework.validateConfig);
    assert(typeof Framework.validateConfig === 'function');
  });

  it('provides valid config defaults', () => {
    assert(Framework.validateConfig(Framework.defaults()) === true);
  });

  it('initializes', () => {
    const config = Framework.defaults();
    const framework = new Framework(config, []);

    describe('Framework instance', () => {
      it('maintains a config', () => {
        assert(framework.config);
        assert.deepEqual(framework.config, config);
      });

      it('attaches body parsers', () => {
        assert(framework.router.stack[0].name === 'jsonParser');
        assert(framework.router.stack[1].name === 'urlencodedParser');
      });
    });
  });

  it('loads a plugin', () => {
    // define a plugin

    // eslint-disable-next-line require-jsdoc
    function testMiddleware(req, res, next) {
      res.sendStatus(200);
    }
    const router = Router();
    router.get('/', testMiddleware);
    const plugin = {
      config: {
        base: '/plugin',
      },
      postRouterMiddleware: [],
      preRouterMiddleware: [],
      router,
    };

    // initialize
    const framework = new Framework(Framework.defaults(), [plugin]);

    // create app
    const app = express();
    app.use(framework.app);

    // assertions
    assert.deepEqual(framework.preRouterMiddleware, plugin.preRouterMiddleware);
    assert.deepEqual(
      framework.postRouterMiddleware,
      plugin.postRouterMiddleware,
    );
    return request(app)
      .get(`${Framework.defaults().base}${plugin.config.base}`)
      .expect(200);
  });
});
