import type { paths } from '@/openapi/schema';

export type { ActionState, Todo, TodoId } from '@/shared/types';

export type CreateTodoParams = NonNullable<
  paths['/api/v1/todos/create']['post']['requestBody']
>['content']['application/json'];

export type CreateTodoResponse =
  paths['/api/v1/todos/create']['post']['responses'][201]['content']['application/json']['data'];
