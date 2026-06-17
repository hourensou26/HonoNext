import { Context } from 'hono';

import * as todoService from './service';
import {
  CreateTodoDto,
  TodoResponseDto,
  toTodoResponseDto,
  toTodoResponseDtoList,
  UpdateTodoDto,
} from './types';
import { SuccessResponse, ErrorResponse } from '../shared/types/ApiResponse';

// 全件取得コントローラー
export const getAllTodos = async (c: Context) => {
  try {
    const todos = await todoService.findAllTodos();
    // DTO変換: DB型 → レスポンス型
    const responseTodos = toTodoResponseDtoList(todos);

    const response: SuccessResponse<TodoResponseDto[]> = {
      data: responseTodos,
      statusCode: 200,
    };

    return c.json(response, 200);
  } catch (error) {
    const response: ErrorResponse = {
      error: '取得失敗',
      statusCode: 500,
    };
    return c.json(response, 500);
  }
};

// IDで取得コントローラー
export const getTodoById = async (c: Context) => {
  const id = Number(c.req.param('id'));

  try {
    const todo = await todoService.findTodoById(id);
    if (!todo) {
      return c.json({ error: 'Todo not found', statusCode: 404 }, 404);
    }
    // DTO変換: DB型 → レスポンス型
    const responseTodo = toTodoResponseDto(todo);

    const response: SuccessResponse<TodoResponseDto> = {
      data: responseTodo,
      statusCode: 200,
    };
    return c.json(response, 200);
  } catch (error) {
    const response: ErrorResponse = {
      error: '取得失敗',
      statusCode: 500,
    };
    return c.json(response, 500);
  }
};

// 新規作成コントローラー
export const createTodoHandler = async (c: Context) => {
  try {
    // 検証済みデータを取得
    const body = (await c.req.json()) as CreateTodoDto;

    // サービス呼び出し
    const newTodo = await todoService.createNewTodo(body.title, body.description);

    // レスポンス整形
    const responseTodo = toTodoResponseDto(newTodo);
    const response: SuccessResponse<TodoResponseDto> = {
      data: responseTodo,
      statusCode: 201,
    };
    return c.json(response, 201);
  } catch (error) {
    console.error('Todo作成エラー:', error);
    const response: ErrorResponse = {
      error: 'Todo作成に失敗しました',
      statusCode: 500,
    };
    return c.json(response, 500);
  }
};

export const updateTodoHandler = async (c: Context) => {
  const id = Number(c.req.param('id'));

  try {
    // リクエストボディを取得
    const body = (await c.req.json()) as UpdateTodoDto;
    const updatedTodo = await todoService.updateTodo(
      id,
      body.title,
      body.description,
      body.completed
    );

    // DTO変換
    const responseTodo = toTodoResponseDto(updatedTodo);

    const response: SuccessResponse<TodoResponseDto> = {
      data: responseTodo,
      statusCode: 200,
    };
    return c.json(response, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'Todo not found') {
      const response: ErrorResponse = {
        error: 'Todo not found',
        statusCode: 404,
      };
      return c.json(response, 404);
    }
    const errorId = `todo-update-${Date.now()}`;
    console.error(`Todo更新エラー [${errorId}]:`, error);
    const response: ErrorResponse = {
      error: 'Todo更新に失敗しました',
      statusCode: 500,
    };
    return c.json(response, 500);
  }
};

export const deleteTodoHandler = async (c: Context) => {
  const id = Number(c.req.param('id'));

  try {
    await todoService.deleteTodo(id);
    const response: SuccessResponse<{ id: number }> = {
      data: { id },
      statusCode: 200,
    };
    return c.json(response, 200);
  } catch (error) {
    if (error instanceof Error && error.message === 'Todo not found') {
      const response: ErrorResponse = {
        error: 'Todo not found',
        statusCode: 404,
      };
      return c.json(response, 404);
    }
    const response: ErrorResponse = {
      error: '削除失敗',
      statusCode: 500,
    };
    return c.json(response, 500);
  }
};
