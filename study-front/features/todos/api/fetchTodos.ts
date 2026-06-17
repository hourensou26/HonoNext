import api from "@/openapi/client";
import type { paths } from "@/openapi/schema";

//responseのdataに一覧があるため、data.data
type TodosResponse =
  paths["/api/v1/todos"]["get"]["responses"][200]["content"]["application/json"]["data"];

export const fetchTodos = async (): Promise<TodosResponse> => {
  const { data, error, response } = await api.GET("/api/v1/todos");
  if (error) throw new Error(`Failed : ${response.status}`);
  return data.data;
};
