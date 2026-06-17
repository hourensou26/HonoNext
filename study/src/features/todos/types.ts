import { z } from '@hono/zod-openapi';

export const todoSchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内でなければなりません'),
  description: z.string().optional(),
  completed: z.number().transform((val) => val === 1), // 0/1をbooleanに変換
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Todo = z.infer<typeof todoSchema>;

// route.tsで使う
// バリデーションと型の定義をする
export const todoIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'IDは正の整数でなければなりません'),
});

export const createTodoDtoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内でなければなりません'),

  //なくてもいいけど、あれば文字列でなければならない
  description: z.string().optional(),
});

export const updateTodoDtoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内でなければなりません'),
  description: z.string().optional(),
  completed: z.boolean(),
});

// controller.tsで使う
// コントローラーで使う型定義
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>;
export type UpdateTodoDto = z.infer<typeof updateTodoDtoSchema>;

// レスポンスDTO
export interface TodoResponseDto {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

export const todoResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  title: z.string().openapi({ example: '買い物' }),
  description: z.string().openapi({ example: '牛乳を買う' }),
  completed: z.boolean().openapi({ example: false }),
  createdAt: z.string().openapi({ example: '2024-01-01T00:00:00.000Z' }),
});

export const todoListResponseSchema = z.array(todoResponseSchema);

export const todoSuccessResponseSchema = z.object({
  data: todoResponseSchema,
  statusCode: z.number(),
});

export const todoListSuccessResponseSchema = z.object({
  data: todoListResponseSchema,
  statusCode: z.number(),
});

export const deleteTodoSuccessResponseSchema = z.object({
  data: z.object({ id: z.number() }),
  statusCode: z.number(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  statusCode: z.number(),
  details: z.unknown().optional(),
});

// ═══════════════════════════════════════
// ③ DTO変換関数（これも必要！）
// ═══════════════════════════════════════

export const toTodoResponseDto = (todo: Todo): TodoResponseDto => {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description ?? '',
    completed: todo.completed,
    createdAt: todo.createdAt,
  };
};

export const toTodoResponseDtoList = (todos: Todo[]): TodoResponseDto[] => {
  return todos.map(toTodoResponseDto);
};
