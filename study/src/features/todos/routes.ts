import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import {
  getAllTodos,
  createTodoHandler,
  getTodoById,
  updateTodoHandler,
  deleteTodoHandler,
} from './controller';
import {
  todoIdParamSchema,
  createTodoDtoSchema,
  updateTodoDtoSchema,
  todoListSuccessResponseSchema,
  todoSuccessResponseSchema,
  deleteTodoSuccessResponseSchema,
  errorResponseSchema,
} from './types';

export const todoRoutes = new OpenAPIHono();

const todoTags = ['Todos'];

const listTodosRoute = createRoute({
  method: 'get',
  path: '/',
  tags: todoTags,
  responses: {
    200: {
      description: 'Todo一覧を取得する',
      content: {
        'application/json': {
          schema: todoListSuccessResponseSchema,
        },
      },
    },
    500: {
      description: '取得失敗',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const getTodoRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: todoTags,
  request: {
    params: todoIdParamSchema,
  },
  responses: {
    200: {
      description: 'TodoをIDで取得する',
      content: {
        'application/json': {
          schema: todoSuccessResponseSchema,
        },
      },
    },
    404: {
      description: 'Todoが見つからない',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: '取得失敗',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const createTodoRoute = createRoute({
  method: 'post',
  path: '/create',
  tags: todoTags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTodoDtoSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Todoを作成する',
      content: {
        'application/json': {
          schema: todoSuccessResponseSchema,
        },
      },
    },
    500: {
      description: '作成失敗',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const updateTodoRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: todoTags,
  request: {
    params: todoIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateTodoDtoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Todoを更新する',
      content: {
        'application/json': {
          schema: todoSuccessResponseSchema,
        },
      },
    },
    404: {
      description: 'Todoが見つからない',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: '更新失敗',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: todoTags,
  request: {
    params: todoIdParamSchema,
  },
  responses: {
    200: {
      description: 'Todoを削除する',
      content: {
        'application/json': {
          schema: deleteTodoSuccessResponseSchema,
        },
      },
    },
    404: {
      description: 'Todoが見つからない',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: '削除失敗',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

todoRoutes.openapi(listTodosRoute, getAllTodos);
todoRoutes.openapi(getTodoRoute, getTodoById);
todoRoutes.openapi(createTodoRoute, createTodoHandler);
todoRoutes.openapi(updateTodoRoute, updateTodoHandler);
todoRoutes.openapi(deleteTodoRoute, deleteTodoHandler);
