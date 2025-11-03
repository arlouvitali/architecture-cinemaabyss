const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8000;

const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:8080';
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:8081';
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://localhost:8082';
const GRADUAL_MIGRATION = process.env.GRADUAL_MIGRATION === 'true';
const MOVIES_MIGRATION_PERCENT = parseInt(process.env.MOVIES_MIGRATION_PERCENT) || 0;

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.get('/health', (req, res) => {
  res.send('Strangler Fig Proxy is healthy');
});

app.use('/api/movies', (req, res, next) => {
  if (GRADUAL_MIGRATION) {
    const random = Math.floor(Math.random() * 100);

    if (random < MOVIES_MIGRATION_PERCENT) {
      console.log(`Routing movies request to new service (random: ${random}, percent: ${MOVIES_MIGRATION_PERCENT})`);

      return createProxyMiddleware({
        target: MOVIES_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api/movies': '/api/movies'
        },
        onProxyReq: (proxyReq, req, res) => {
          if (req.rawBody) {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
            proxyReq.write(req.rawBody);
          }
        }
      })(req, res, next);
    } else {
      console.log(`Routing movies request to monolith (random: ${random}, percent: ${MOVIES_MIGRATION_PERCENT})`);

      return createProxyMiddleware({
        target: MONOLITH_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api/movies': '/api/movies'
        },
        onProxyReq: (proxyReq, req, res) => {
          if (req.rawBody) {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
            proxyReq.write(req.rawBody);
          }
        }
      })(req, res, next);
    }
  } else {
    return createProxyMiddleware({
      target: MONOLITH_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api/movies': '/api/movies'
      },
      onProxyReq: (proxyReq, req, res) => {
        if (req.rawBody) {
          proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
          proxyReq.write(req.rawBody);
        }
      }
    })(req, res, next);
  }
});

app.use('/api/users', createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.rawBody) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
      proxyReq.write(req.rawBody);
    }
  }
}));

app.use('/api/payments', createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.rawBody) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
      proxyReq.write(req.rawBody);
    }
  }
}));

app.use('/api/subscriptions', createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/subscriptions': '/api/subscriptions'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.rawBody) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
      proxyReq.write(req.rawBody);
    }
  }
}));

app.use('/api/events', createProxyMiddleware({
  target: EVENTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/events': '/api/events'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.rawBody) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
      proxyReq.write(req.rawBody);
    }
  }
}));

app.listen(PORT, () => {
  console.log(`Proxy service listening on port ${PORT}`);
  console.log(`Monolith URL: ${MONOLITH_URL}`);
  console.log(`Movies Service URL: ${MOVIES_SERVICE_URL}`);
  console.log(`Events Service URL: ${EVENTS_SERVICE_URL}`);
  console.log(`Gradual Migration: ${GRADUAL_MIGRATION}`);
  console.log(`Movies Migration Percent: ${MOVIES_MIGRATION_PERCENT}%`);
});
