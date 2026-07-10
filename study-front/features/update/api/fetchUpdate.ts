import { getTodo } from '@/shared/api/getTodo';
import { TodoId, UpdateResponse, UpdateTodoRequestBody } from '../types';

export const fetchTodo = async (todo_id: TodoId) => {
  return await getTodo(todo_id);
};

export const fetchUpdate = async ({ id, title, description, completed }: UpdateTodoRequestBody) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      description: description,
      completed: completed,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed : ${res.status}`);
  }

  const data: { data: UpdateResponse } = await res.json();

  return data.data;
};
