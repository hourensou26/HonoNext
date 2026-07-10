import api from '@/openapi/client';
import type { TodosResponse } from '../types';

//responseのdataに一覧があるため、data.data
export const fetchTodos = async (): Promise<TodosResponse> => {
  const { data, error, response } = await api.GET('/api/v1/todos');
  if (error) throw new Error(`Failed : ${response.status}`);
  return data.data;
};
