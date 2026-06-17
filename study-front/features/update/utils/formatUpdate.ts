import { Todo } from '../types';
export const formatUpdate = (Todo: Todo) => {
  return {
    id: Todo.id,
    title: Todo.title,
    description: Todo.description,
    completed: Todo.completed,
  };
};
