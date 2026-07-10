import { paths } from '@/openapi/schema';
export type { TodoId } from '@/shared/types';

export type DeleteResponse =
  paths['/api/v1/todos/{id}']['delete']['responses'][200]['content']['application/json']['data'];
