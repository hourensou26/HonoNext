import { paths } from '@/openapi/schema';

export type { ActionState, Todo, TodoId } from '@/shared/types';

export type UpdateFormat = Omit<UpdateTodoRequestBody, 'created_at'>;

export type UpdateTodoRequestBody = paths['/api/v1/todos/{id}']['put']['parameters']['path'] &
  NonNullable<paths['/api/v1/todos/{id}']['put']['requestBody']>['content']['application/json'];

export type UpdateResponse =
  paths['/api/v1/todos/{id}']['put']['responses'][200]['content']['application/json']['data'];
