import { TodoResponse } from '../types';
import { CreateTodoParams } from '../types';

export const fetchCreate = async ({ title, description }: CreateTodoParams) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/todos/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      description: description,
      completed: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create todo: ${response.status}`);
  }

  const data: { data: TodoResponse } = await response.json();
  return data.data;
};
