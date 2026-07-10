import api from '@/openapi/client';
import { Todo, TodoId } from '@/shared/types';

export const getTodo = async (todo_id: TodoId): Promise<Todo> => {
  const { data, error, response } = await api.GET('/api/v1/todos/{id}', {
    params: {
      path: { id: todo_id },
    },
  });
  if (error) throw new Error(`Failed : ${response.status}`);
  return data.data;
};
