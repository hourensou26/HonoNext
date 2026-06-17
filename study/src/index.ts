// src/index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';

import todoRoutes from './features/todos';

const app = new OpenAPIHono();

// グローバルミドルウェア(全ルートに適用)
app.use('*', cors());

// 各機能をマウント
app.route('/api/v1/todos', todoRoutes);

// OpenAPIドキュメント
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Todo API',
    version: '1.0.0',
  },
});
app.get('/docs', swaggerUI({ url: '/openapi.json' }));

// ルートパス
app.get('/', (c) => {
  return c.json({
    message: 'Todo API',
    endpoints: {
      todos: '/api/v1/todos',
      health: '/health',
    },
  });
});

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
