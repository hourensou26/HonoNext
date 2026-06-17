import { Todo } from '../types';

//必要なもののみ返す
export const formatCreateResponse = (Todo: Todo) => {
  return {
    id: Todo.id,
  };
};
