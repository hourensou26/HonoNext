import type { paths } from '@/openapi/schema';

export type TodosResponse =
  paths['/api/v1/todos']['get']['responses'][200]['content']['application/json']['data'];

export type Todo =
  paths['/api/v1/todos/{id}']['get']['responses'][200]['content']['application/json']['data'];

export type TodoId = paths['/api/v1/todos/{id}']['delete']['parameters']['path']['id'];

export type Todos = Pick<Todo, 'id' | 'title' | 'completed'>;

export type ActionState = {
  error?: string;
};
