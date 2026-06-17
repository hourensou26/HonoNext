-- テーブル作成
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ
INSERT INTO todos (title, description, completed) VALUES
('TypeScript学習', '基礎を学ぶ', 0),
('Hono API作成', 'CRUD実装', 0),
('SQLite理解', 'DB操作確認', 0);