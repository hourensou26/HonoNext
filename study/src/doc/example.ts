import { Hono } from 'hono';

import {
  getTodo,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../features/todos/repository';

const app = new Hono();
const todoApp = new Hono();

// 一覧
todoApp.get('/', (c) => {
  const response = getTodos();
  return c.json({
    data: response,
    statuscode: 200,
  });
});

// 1件
todoApp.get('/:id', (c) => {
  const id = c.req.param('id');
  const response = getTodo(Number(id));

  if (!response) {
    return c.json({
      message: `Todo ${id} not found`,
      statuscode: 404,
    });
  }

  return c.json({
    data: response,
    statuscode: 200,
  });
});

// 作成
todoApp.post('/create', async (c) => {
  const { title, description } = await c.req.json();

  const result = createTodo(title, description);

  return c.json({
    data: {
      id: result.lastInsertRowid,
      title,
      description,
      completed: false,
    },
    statuscode: 201,
  });
});

// 更新
todoApp.put('/update/:id', async (c) => {
  const id = c.req.param('id');
  const { title, description, completed } = await c.req.json();
  const response = updateTodo(title, description, completed, Number(id));
  return c.json({
    data: response,
    statuscode: 200,
  });
});

// 削除
todoApp.delete('/delete/:id', (c) => {
  const id = c.req.param('id');

  const response = deleteTodo(Number(id));

  return c.json({
    message:
      response.changes > 0 ? `Todo ${id} deleted` : `Todo ${id} not found`,
    statuscode: 200,
  });
});

app.route('/api/v1/todos', todoApp);

export default app;
