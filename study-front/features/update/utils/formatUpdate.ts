import { Todo } from '../types';
export const formatUpdate = (Todo: Todo) => {
  return {
    id: String(Todo.id),
    title: Todo.title,
    description: Todo.description,
    completed: Todo.completed,
  };
};
