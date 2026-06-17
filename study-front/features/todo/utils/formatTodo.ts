import { Todo } from '../types';
export const formatTodo = (Todo: Todo) => {
  return {
    id: Todo.id,
    title: Todo.title,
    description: Todo.description,
    completed: Todo.completed,
    createdAt: Todo.createdAt,
  };
};
