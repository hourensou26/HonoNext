import { Todos } from '../types';

//必要なもののみ返す
export const formatTodo = (Todo: Todos) => {
  return {
    id: Todo.id,
    title: Todo.title,
    completed: Todo.completed,
  };
};
