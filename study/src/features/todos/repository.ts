import Database from 'better-sqlite3';

import { Todo, todoSchema } from './types';

const db = new Database('todos.db');

// テーブル作成
db.exec(`
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// ===== ヘルパー関数 =====
/**
 * 値の存在を保証する
 * @param value - チェックする値
 * @param errorMessage - エラーメッセージ（省略可）
 * @returns 存在が保証された値
 */
const ensureExists = <T>(value: T | undefined, errorMessage: string = 'Todo not found'): T => {
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
};

// ===== CRUD操作 =====

export const getTodos = (): Todo[] => {
  const rows = db.prepare('SELECT * FROM todos').all();
  return rows.map((row) => todoSchema.parse(row)); // Zodでバリデーション
};

export const getTodo = (id: number): Todo | undefined => {
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!row) return undefined;
  return todoSchema.parse(row); // Zodでバリデーション
};

export const createTodo = (title: string, description?: string): Todo => {
  const result = db
    .prepare('INSERT INTO todos (title, description) VALUES (?, ?)')
    .run(title, description);

  const id = Number(result.lastInsertRowid);
  const newTodo = getTodo(id); // 追加したTodoを取得して返す

  return ensureExists(newTodo, 'Failed to create todo');
};

export const updateTodo = (
  id: number,
  title: string,
  description: string | undefined,
  completed: boolean
): Todo => {
  db.prepare(
    `
      UPDATE todos
      SET title = ?, description = ?, completed = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(title, description, completed ? 1 : 0, id);

  const updatedTodo = getTodo(id);

  return ensureExists(updatedTodo, 'Failed to update todo');
};

export const deleteTodo = (id: number): void => {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new Error('Todo not found');
  }
};

export default db;
