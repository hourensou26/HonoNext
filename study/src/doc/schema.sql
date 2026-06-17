-- ============================================
-- Cloudflare Workers D1 データベーススキーマ
-- ============================================
-- このファイルは、ユーザー管理システムのデータベース構造を定義します
--
-- 使い方:
--   ローカル環境: wrangler d1 execute my-user-database --local --file=./schema.sql
--   本番環境:     wrangler d1 execute my-user-database --file=./schema.sql

-- ============================================
-- usersテーブルの作成
-- ============================================

-- 既存のテーブルがあれば削除（初期化用）
-- 注意：本番環境では慎重に使用すること（データが全て消えます）
DROP TABLE IF EXISTS users;

-- usersテーブルを作成
-- このテーブルは、ユーザーの基本情報を保存します
CREATE TABLE users (
  -- id: ユーザーの一意識別子（主キー）
  -- INTEGER: 整数型
  -- PRIMARY KEY: このカラムが主キー（重複不可、必須）
  -- AUTOINCREMENT: 自動的に1, 2, 3...と番号を振る
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- name: ユーザーの名前
  -- TEXT: 文字列型（SQLiteでは文字数制限なし）
  -- NOT NULL: 必須項目（空白不可）
  name TEXT NOT NULL,

  -- email: ユーザーのメールアドレス
  -- TEXT: 文字列型
  -- NOT NULL: 必須項目
  -- UNIQUE: 一意制約（重複不可）- 同じメールアドレスは登録できない
  email TEXT NOT NULL UNIQUE,

  -- age: ユーザーの年齢
  -- INTEGER: 整数型
  -- NOT NULL: 必須項目
  -- CHECK: 年齢が0以上150以下であることを保証
  age INTEGER NOT NULL CHECK(age >= 0 AND age <= 150),

  -- createdAt: アカウント作成日時
  -- TEXT: 文字列型（ISO 8601形式で保存）
  -- NOT NULL: 必須項目
  -- DEFAULT: デフォルト値として現在時刻を設定
  -- CURRENT_TIMESTAMP: SQLiteの組み込み関数（現在のUTC時刻）
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- インデックスの作成
-- ============================================
-- インデックスは、データ検索を高速化するための仕組みです
-- 頻繁に検索されるカラムにインデックスを作成すると効果的です

-- emailカラムにインデックスを作成
-- メールアドレスでの検索が高速になります
-- UNIQUEインデックス: 一意性も保証します
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- nameカラムにインデックスを作成
-- 名前での検索（LIKE検索など）が高速になります
CREATE INDEX idx_users_name ON users(name);

-- ============================================
-- 初期データの投入
-- ============================================
-- テスト用・開発用の初期データを挿入します

INSERT INTO users (name, email, age, createdAt) VALUES
  ('山田太郎', 'taro@example.com', 25, '2026-01-15T10:00:00Z'),
  ('佐藤花子', 'hanako@example.com', 22, '2026-02-20T14:30:00Z'),
  ('鈴木次郎', 'jiro@example.com', 28, '2026-03-10T09:15:00Z'),
  ('田中美咲', 'misaki@example.com', 24, '2026-03-15T11:20:00Z'),
  ('高橋健太', 'kenta@example.com', 30, '2026-03-20T08:45:00Z');

-- ============================================
-- データ型の説明
-- ============================================
--
-- SQLite（D1）で使える主なデータ型:
--
-- 1. INTEGER（整数）
--    - 数値を保存（-9223372036854775808 ～ 9223372036854775807）
--    - 例: id, age, count など
--
-- 2. TEXT（文字列）
--    - 文字列を保存（長さ制限なし）
--    - 例: name, email, description など
--
-- 3. REAL（浮動小数点数）
--    - 小数を保存
--    - 例: price, rating, temperature など
--
-- 4. BLOB（バイナリデータ）
--    - 画像やファイルなどのバイナリデータ
--    - 通常はあまり使わない（R2を使う方が良い）
--
-- 5. NULL
--    - 値が存在しないことを表す
--    - NOT NULL制約があれば使えない

-- ============================================
-- 制約（Constraint）の説明
-- ============================================
--
-- 1. PRIMARY KEY（主キー制約）
--    - テーブル内で各行を一意に識別するカラム
--    - 自動的に NOT NULL と UNIQUE が適用される
--    - 1つのテーブルに1つだけ設定可能
--
-- 2. NOT NULL（非NULL制約）
--    - そのカラムには必ず値が必要
--    - NULLを挿入しようとするとエラーになる
--
-- 3. UNIQUE（一意制約）
--    - そのカラムの値は重複不可
--    - 同じ値を挿入しようとするとエラーになる
--    - NULLは許可される（複数のNULLは可能）
--
-- 4. CHECK（チェック制約）
--    - カラムの値が特定の条件を満たすことを保証
--    - 例: CHECK(age >= 0)
--
-- 5. DEFAULT（デフォルト値）
--    - 値が指定されなかった場合のデフォルト値
--    - 例: DEFAULT CURRENT_TIMESTAMP
--
-- 6. FOREIGN KEY（外部キー制約）
--    - 他のテーブルのPRIMARY KEYを参照
--    - データの整合性を保証
--    - （このスキーマでは使用していません）

-- ============================================
-- AUTOINCREMENTの動作
-- ============================================
--
-- AUTOINCREMENTを使うと:
-- 1. 最初のINSERTでid=1が自動的に割り当てられる
-- 2. 2番目のINSERTでid=2が自動的に割り当てられる
-- 3. 行を削除しても、削除されたIDは再利用されない
--    （例: id=2を削除しても、次は id=3 になる）
-- 4. sqlite_sequenceテーブルで管理されている
--
-- 手動でIDを指定することも可能:
-- INSERT INTO users (id, name, email, age) VALUES (100, 'test', 'test@example.com', 20);
-- ただし、推奨されません（AUTOINCREMENTに任せる方が安全）

-- ============================================
-- トラブルシューティング
-- ============================================
--
-- エラー: "UNIQUE constraint failed: users.email"
-- 原因: 既に存在するメールアドレスを挿入しようとした
-- 解決: 別のメールアドレスを使用するか、既存のデータを更新する
--
-- エラー: "CHECK constraint failed: users"
-- 原因: age が 0未満 または 150より大きい
-- 解決: 年齢を正しい範囲（0-150）に修正する
--
-- エラー: "NOT NULL constraint failed: users.name"
-- 原因: nameカラムにNULLを挿入しようとした
-- 解決: 必ず値を指定する

-- ============================================
-- データベースの確認コマンド
-- ============================================
--
-- すべてのテーブルを表示:
--   wrangler d1 execute my-user-database --local --command="SELECT name FROM sqlite_master WHERE type='table';"
--
-- usersテーブルのスキーマを表示:
--   wrangler d1 execute my-user-database --local --command="PRAGMA table_info(users);"
--
-- usersテーブルの全データを表示:
--   wrangler d1 execute my-user-database --local --command="SELECT * FROM users;"
--
-- データ件数を確認:
--   wrangler d1 execute my-user-database --local --command="SELECT COUNT(*) FROM users;"

-- ============================================
-- 次のステップ
-- ============================================
--
-- このスキーマを適用したら:
-- 1. TypeScriptコードでD1に接続
-- 2. CRUD操作（Create, Read, Update, Delete）を実装
-- 3. エラーハンドリングを追加
-- 4. トランザクションを学ぶ
-- 5. 複数テーブルとJOINを学ぶ
