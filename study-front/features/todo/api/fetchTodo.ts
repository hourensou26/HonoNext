import { getTodo } from "@/shared/api/getTodo";

type FetchTodoParams = Parameters<typeof getTodo>[0];

export const fetchTodo = async (todo_id: FetchTodoParams) => {
  return await getTodo(todo_id);
};