import api from "@/openapi/client";
import type { paths } from "@/openapi/schema";

//responseのdataに一覧があるため、data.data
type TodoId = paths["/api/v1/todos/{id}"]["get"]["parameters"]["path"]["id"];
type TodoResponse =
  paths["/api/v1/todos/{id}"]["get"]["responses"][200]["content"]["application/json"]["data"];

export const getTodo = async (todo_id: TodoId): Promise<TodoResponse> => {
  const { data, error, response } = await api.GET("/api/v1/todos/{id}", {
    params: {
      path: { id: todo_id },
    },
  });
  if (error) throw new Error(`Failed : ${response.status}`);
  return data.data;
};