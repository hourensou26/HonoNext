import * as todoResponse from './repository';
import { Todo } from './types';

// 全件取得サービス
export const findAllTodos = () => {
  return todoResponse.getTodos(); // リポジトリに任せる
};

// IDで取得サービス
export const findTodoById = (id: number): Todo | undefined => {
  return todoResponse.getTodo(id);
};

// 新規作成サービス
export const createNewTodo = (title: string, description?: string): Todo => {
  // ビジネスロジック: デフォルト値設定
  const finalDescription = description || '説明なし';

  // リポジトリ呼び出し
  const result = todoResponse.createTodo(title, finalDescription);

  return result;
};

export const updateTodo = (
  id: number,
  title: string,
  description: string | undefined,
  completed: boolean
): Todo => {
  const result = todoResponse.updateTodo(id, title, description, completed);
  // Todo型で返す
  return result;
};

export const deleteTodo = (id: number): { id: number } => {
  const existingTodo = todoResponse.getTodo(id);
  if (!existingTodo) throw new Error('Todo not found');

  todoResponse.deleteTodo(id);

  return { id };
};

// 完了状態を切り替えるサービス(ビジネスロジックの例)
export const toggleTodoStatus = (id: number): Todo => {
  // 1. まず現在のTodoを取得
  const todo = todoResponse.getTodo(id);
  if (!todo) throw new Error('Todo not found');

  // 2. 完了状態を反転
  // 3. 更新（descriptionが未定義の場合は空文字にする）
  return todoResponse.updateTodo(id, todo.title, todo.description ?? '', !todo.completed);
};
