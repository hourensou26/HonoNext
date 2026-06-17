export type TodoId = string;

export type Todo = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
};

export type Todos = {
  id: number;
  title: string;
  completed: boolean;
};

export type ActionState = {
  error?: string;
};

export type CreateTodoParams = {
  title: string;
  description: string;
};

export type UpdateTodoParams = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
};

export interface TodoResponse {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
