# Cloudflare Workers D1 データベース連携チュートリアル

このチュートリアルでは、Cloudflare Workers D1データベースとHonoフレームワークを統合する方法を、初学者にも分かりやすく解説します。

**対象読者：**
- SQLの基礎知識がある方（CREATE, SELECT, INSERT, UPDATE, DELETE）
- TypeScript と Hono の基礎を学習済みの方
- データベースの永続化について学びたい方

**前提条件：**
- Node.js がインストールされている
- このプロジェクト (`my-app`) が動作している
- Cloudflare アカウント（無料）を持っている（または作成できる）

---

## 目次

1. [イントロダクション](#1-イントロダクション)
2. [Cloudflare Workers D1の基礎](#2-cloudflare-workers-d1の基礎)
3. [セットアップガイド](#3-セットアップガイド)
4. [D1 APIの使い方](#4-d1-apiの使い方)
5. [配列操作とSQLの対応](#5-配列操作とsqlの対応)
6. [実践例：users-api.tsの移行](#6-実践例users-apitsの移行)
7. [エラーハンドリング](#7-エラーハンドリング)
8. [ベストプラクティス](#8-ベストプラクティス)
9. [デバッグとトラブルシューティング](#9-デバッグとトラブルシューティング)
10. [ローカル開発と本番環境](#10-ローカル開発と本番環境)
11. [次のステップ](#11-次のステップ)

---

## 1. イントロダクション

### 1.1 データベースとは何か？

**データベース**とは、データを構造化して保存・管理するシステムです。

たとえ話で説明すると：
- **配列（メモリ）** = 付箋紙にメモを書いて机の上に置く
  - 電源を切ると消える
  - 机が小さいと置ける付箋の数に限界がある
  - 他の人（他のサーバー）とは共有できない

- **データベース** = ノートに記録する
  - 電源を切っても消えない（**永続化**）
  - 何千ページでも記録できる
  - 複数人で共有できる
  - 特定のページを素早く探せる（**インデックス**）

### 1.2 なぜメモリ内配列では不十分なのか？

現在の `src/users-api.ts` では、ユーザーデータを配列に保存しています：

```typescript
let users: User[] = [
  { id: 1, name: '山田太郎', email: 'taro@example.com', age: 25, ... },
  { id: 2, name: '佐藤花子', email: 'hanako@example.com', age: 22, ... },
  ...
]
```

**この方法の問題点：**

1. **データの永続化がない**
   - サーバーを再起動すると、すべてのデータが消えます
   - ユーザーが登録した情報が失われます

2. **複数インスタンス間での共有ができない**
   - Cloudflare Workers は世界中に複数のサーバーを展開しています
   - 各サーバーが独自の配列を持つため、データが同期されません
   - ユーザーAがサーバー1で登録、ユーザーBがサーバー2にアクセス → データが見えない

3. **大量データの処理に不向き**
   - すべてのデータをメモリに読み込むため、ユーザーが10万人いると大変
   - 検索も遅くなる（配列全体をループする必要がある）

4. **トランザクションがない**
   - 複数の処理を一括で行う際、途中で失敗しても元に戻せない

**データベースを使うメリット：**

✅ データが永続化される
✅ 複数のサーバー間でデータを共有できる
✅ 大量のデータを効率的に処理できる
✅ 検索が高速（インデックス）
✅ トランザクションで安全な処理ができる
✅ バックアップと復元が簡単

---

## 2. Cloudflare Workers D1の基礎

### 2.1 D1とは？

**Cloudflare Workers D1**（ディーワン）は、Cloudflareが提供するサーバーレス向けSQLデータベースです。

**特徴：**
- **SQLiteベース**: 標準的なSQLを使用（学習しやすい）
- **サーバーレス最適化**: Cloudflare Workers で動作するよう設計されている
- **グローバル分散**: 世界中のデータセンターでデータを複製
- **低レイテンシ**: ユーザーの近くのデータセンターからデータを提供
- **無料枠あり**: 学習や小規模アプリに十分な無料枠

### 2.2 他のデータベースとの違い

#### PostgreSQL / MySQL との比較

| 項目 | D1（SQLite） | PostgreSQL / MySQL |
|------|--------------|-------------------|
| **設置** | Cloudflare管理 | 自分でサーバー管理 |
| **SQL方言** | SQLite | PostgreSQL / MySQL |
| **複雑なクエリ** | 制限あり | 高度なクエリ可能 |
| **スケール** | 自動 | 手動設定必要 |
| **コスト** | 無料枠あり | サーバー費用 |
| **学習曲線** | 易しい | やや難しい |

**D1が適している場合：**
- Cloudflare Workers を使っている
- サーバーレス環境で動かしたい
- 管理の手間を減らしたい
- 学習用・中小規模アプリ

**PostgreSQL/MySQLが適している場合：**
- 複雑なクエリが必要
- 大規模なデータ処理
- 既存システムとの互換性が必要

#### Cloudflare KVとの違い

| 項目 | D1 | KV |
|------|----|----|
| **データ構造** | テーブル（行と列） | キー・バリュー |
| **検索** | SQL（柔軟） | キーのみ |
| **リレーション** | 可能（JOIN） | 不可 |
| **トランザクション** | あり | なし |
| **用途** | 構造化データ | 設定値、キャッシュ |

**KVは簡単ですが、機能が限定的です。D1は柔軟性が高いです。**

### 2.3 D1の制約（重要）

D1はサーバーレス環境に最適化されているため、いくつかの制約があります：

1. **接続時間制限**
   - クエリは短時間で完了する必要がある（通常は問題なし）

2. **データベースサイズ**
   - 無料枠: 5GB まで
   - 有料プラン: それ以上も可能

3. **同時書き込み**
   - 1つのデータベースに対する同時書き込みは制限される
   - 読み取りは制限なし

4. **SQLite制限**
   - PostgreSQLの高度な機能（一部）は使えない
   - 例: ストアドプロシージャ、トリガーの一部

**ほとんどの Webアプリケーションでは、これらの制約は問題になりません。**

---

## 3. セットアップガイド

このセクションでは、D1データベースをプロジェクトに統合する手順を、ステップバイステップで解説します。

### ステップ1: D1データベースの作成

ターミナルで以下のコマンドを実行します：

```bash
wrangler d1 create my-user-database
```

**何が起こるか：**
- Cloudflareのクラウド上に新しいデータベースが作成されます
- `my-user-database` はデータベースの名前（任意の名前でOK）

**出力例：**
```
✅ Successfully created DB 'my-user-database'

[[d1_databases]]
binding = "DB"
database_name = "my-user-database"
database_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**重要：** `database_id` の値をコピーしてください。次のステップで使います。

### ステップ2: wrangler.jsoncの設定

プロジェクトのルートディレクトリにある `wrangler.jsonc` を開き、以下の部分のコメントを外して編集します：

**変更前：**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "main": "src/index.ts",
  "compatibility_date": "2026-03-17"
  // "d1_databases": [
  //   {
  //     "binding": "MY_DB",
  //     "database_name": "my-database",
  //     "database_id": ""
  //   }
  // ]
}
```

**変更後：**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "main": "src/index.ts",
  "compatibility_date": "2026-03-17",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-user-database",
      "database_id": "ステップ1でコピーしたID"
    }
  ]
}
```

**各項目の意味：**

- **`binding`**: TypeScriptコード内でデータベースにアクセスする際の変数名
  - 例: `c.env.DB.prepare(...)` の `DB` 部分
  - 任意の名前でOKですが、慣習として大文字を使います

- **`database_name`**: データベースの名前（ステップ1で指定したもの）

- **`database_id`**: Cloudflareがデータベースを識別するための一意のID

### ステップ3: スキーマ定義

プロジェクトのルートディレクトリに `schema.sql` ファイルを作成します。

**このファイルは既に用意されています！**
プロジェクトルートの `schema.sql` を確認してください。

**schema.sql の内容（抜粋）：**
```sql
-- usersテーブルを作成
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  age INTEGER NOT NULL CHECK(age >= 0 AND age <= 150),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name);

-- 初期データを投入
INSERT INTO users (name, email, age, createdAt) VALUES
  ('山田太郎', 'taro@example.com', 25, '2026-01-15T10:00:00Z'),
  ('佐藤花子', 'hanako@example.com', 22, '2026-02-20T14:30:00Z'),
  ('鈴木次郎', 'jiro@example.com', 28, '2026-03-10T09:15:00Z');
```

**用語解説：**

- **`CREATE TABLE`**: 新しいテーブル（データを入れる箱）を作成
- **`PRIMARY KEY`**: 各行を一意に識別するキー（重複しない値）
- **`AUTOINCREMENT`**: 自動的に番号を増やす（1, 2, 3...）
- **`NOT NULL`**: 必須項目（空白不可）
- **`UNIQUE`**: 重複不可（メールアドレスは一意である必要がある）
- **`CHECK`**: 値の範囲をチェック（年齢は0〜150）
- **`DEFAULT CURRENT_TIMESTAMP`**: デフォルト値として現在時刻を設定
- **`CREATE INDEX`**: 検索を高速化するためのインデックスを作成

### ステップ4: スキーマの適用

スキーマファイルをデータベースに適用します。

**ローカル環境（開発用）：**
```bash
wrangler d1 execute my-user-database --local --file=./schema.sql
```

**何が起こるか：**
- ローカルのテスト用データベースが作成されます
- `.wrangler/state/v3/d1/` フォルダにSQLiteファイルが保存されます
- usersテーブルが作成され、初期データが投入されます

**出力例：**
```
🌀 Executing on my-user-database (local):
🌀 To execute on your remote database, add a --remote flag to your wrangler command.

🚣 Executed 3 commands in 0.02ms
```

**本番環境（後で実施）：**
```bash
wrangler d1 execute my-user-database --file=./schema.sql
```

**注意：** 本番環境へのスキーマ適用は、デプロイ前に一度だけ実行します。

### ステップ5: 型定義の追加

TypeScriptで型安全にD1を使うため、型定義を追加します。

#### 方法1: src/users-api.ts に直接追加（推奨）

```typescript
import { Hono } from 'hono'

// Bindings型を定義
type Bindings = {
  DB: D1Database  // D1Databaseは Cloudflare Workers の組み込み型
}

// Honoアプリ作成時にBindingsを指定
const app = new Hono<{ Bindings: Bindings }>()

// これで c.env.DB が型安全にアクセスできます
app.get('/users', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM users').all()
  //                        ↑↑↑ 型推論が効く
  return c.json(result.results)
})
```

#### 方法2: 別ファイルで型定義（大規模プロジェクト向け）

`src/types.ts` を作成：

```typescript
export type Bindings = {
  DB: D1Database
}
```

各ファイルでインポート：

```typescript
import { Hono } from 'hono'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()
```

### ステップ6: 動作確認

開発サーバーを起動して、データベース接続を確認します。

```bash
npm run dev
```

別のターミナルで：

```bash
# データベース内のデータを直接確認
wrangler d1 execute my-user-database --local --command="SELECT * FROM users;"
```

**出力例：**
```
┌────┬──────────┬──────────────────────┬─────┬──────────────────────────┐
│ id │ name     │ email                │ age │ createdAt                │
├────┼──────────┼──────────────────────┼─────┼──────────────────────────┤
│  1 │ 山田太郎 │ taro@example.com     │  25 │ 2026-01-15T10:00:00Z     │
│  2 │ 佐藤花子 │ hanako@example.com   │  22 │ 2026-02-20T14:30:00Z     │
│  3 │ 鈴木次郎 │ jiro@example.com     │  28 │ 2026-03-10T09:15:00Z     │
└────┴──────────┴──────────────────────┴─────┴──────────────────────────┘
```

**✅ セットアップ完了！** これでD1データベースが使えるようになりました。

---

## 4. D1 APIの使い方

このセクションでは、D1データベースを操作するためのAPIを詳しく解説します。

### 4.1 基本的な流れ

D1でクエリを実行する基本的なステップ：

```typescript
// ステップ1: SQLクエリを準備
const stmt = c.env.DB.prepare('SELECT * FROM users')

// ステップ2: パラメータをバインド（必要な場合）
const boundStmt = stmt.bind(123)

// ステップ3: クエリを実行
const result = await boundStmt.all()

// ステップ4: 結果を使用
console.log(result.results)
```

**メソッドチェーン（短縮形）：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(123)
  .all()
```

### 4.2 prepare() - SQLクエリの準備

**構文：**
```typescript
c.env.DB.prepare(sql: string): D1PreparedStatement
```

**説明：**
- SQLクエリ文字列を受け取り、実行可能なステートメントに変換します
- まだデータベースには実行されません（準備だけ）

**例：**
```typescript
// SELECT クエリの準備
const stmt1 = c.env.DB.prepare('SELECT * FROM users')

// INSERT クエリの準備
const stmt2 = c.env.DB.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')

// UPDATE クエリの準備
const stmt3 = c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?')
```

**プレースホルダー `?` について：**
- SQLインジェクション攻撃を防ぐために使用
- 値はbind()メソッドで安全にバインドされます

### 4.3 bind() - パラメータのバインド

**構文：**
```typescript
stmt.bind(...values: any[]): D1PreparedStatement
```

**説明：**
- プレースホルダー `?` に値を安全にバインドします
- 複数の値を渡すことができます
- SQL インジェクション攻撃を防ぎます

**例：**
```typescript
// 1つの値をバインド
const stmt1 = c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(123)

// 複数の値をバインド（順番が重要！）
const stmt2 = c.env.DB.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')
  .bind('田中太郎', 'tanaka@example.com', 30)

// 配列を展開してバインド
const values = ['田中太郎', 'tanaka@example.com', 30]
const stmt3 = c.env.DB.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')
  .bind(...values)  // スプレッド演算子
```

**❌ 絶対にやってはいけないこと：文字列連結**
```typescript
// 危険！SQLインジェクション攻撃の原因になる
const userId = req.query.id  // ユーザー入力
const stmt = c.env.DB.prepare(`SELECT * FROM users WHERE id = ${userId}`)
// もし userId が "1 OR 1=1" だったら、全データが漏洩します！

// ✅ 正しい方法：bind()を使う
const stmt = c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId)
```

### 4.4 all() - 全件取得

**構文：**
```typescript
stmt.all(): Promise<D1Result<T>>
```

**説明：**
- クエリを実行し、すべての結果を配列で返します
- `SELECT` クエリで使用します

**返り値の構造：**
```typescript
{
  results: Array<T>,    // 取得したデータの配列
  success: boolean,     // クエリが成功したか
  meta: {
    duration: number,   // 実行時間（ミリ秒）
    rows_read: number,  // 読み取った行数
    rows_written: number // 書き込んだ行数（通常0）
  }
}
```

**例：**
```typescript
// 全ユーザーを取得
const result = await c.env.DB.prepare('SELECT * FROM users').all()
console.log(result.results)  // [{ id: 1, name: '...', ... }, ...]

// 条件付きで取得
const result2 = await c.env.DB.prepare('SELECT * FROM users WHERE age >= ?')
  .bind(20)
  .all()
```

### 4.5 first() - 1件取得

**構文：**
```typescript
stmt.first(colName?: string): Promise<T | null>
```

**説明：**
- クエリを実行し、最初の1行だけを返します
- 見つからない場合は `null` を返します
- 特定のカラムだけを取得することもできます

**例：**
```typescript
// ユーザーを1件取得
const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(123)
  .first()

if (user) {
  console.log(user.name)  // '山田太郎'
} else {
  console.log('ユーザーが見つかりません')
}

// 特定のカラムだけ取得
const name = await c.env.DB.prepare('SELECT name FROM users WHERE id = ?')
  .bind(123)
  .first('name')
console.log(name)  // '山田太郎' （文字列のみ）
```

**all()との使い分け：**
- `first()`: 1件だけ取得したい場合（IDで検索など）
- `all()`: 複数件取得したい場合（一覧表示、検索結果など）

### 4.6 run() - 実行（INSERT / UPDATE / DELETE）

**構文：**
```typescript
stmt.run(): Promise<D1Result<never>>
```

**説明：**
- `INSERT`, `UPDATE`, `DELETE` クエリを実行します
- データは返さず、実行結果のメタ情報を返します

**返り値の構造：**
```typescript
{
  success: boolean,
  meta: {
    duration: number,
    last_row_id: number,    // INSERT時に挿入された行のID
    rows_read: number,
    rows_written: number,   // 影響を受けた行数
    size_after: number      // データベースのサイズ
  }
}
```

**INSERT の例：**
```typescript
const result = await c.env.DB.prepare(`
  INSERT INTO users (name, email, age, createdAt)
  VALUES (?, ?, ?, ?)
`).bind('新規ユーザー', 'new@example.com', 25, new Date().toISOString())
  .run()

console.log(result.meta.last_row_id)  // 新しく作成されたユーザーのID
```

**UPDATE の例：**
```typescript
const result = await c.env.DB.prepare('UPDATE users SET age = ? WHERE id = ?')
  .bind(26, 123)
  .run()

console.log(result.meta.rows_written)  // 1 （1行更新された）
```

**DELETE の例：**
```typescript
const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
  .bind(123)
  .run()

console.log(result.meta.rows_written)  // 1 （1行削除された）
```

### 4.7 batch() - トランザクション（複数クエリの一括実行）

**構文：**
```typescript
c.env.DB.batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
```

**説明：**
- 複数のクエリをトランザクションとして実行します
- **すべて成功** するか、**すべて失敗**（ロールバック）します
- 中途半端な状態にならないことを保証します

**例：複数ユーザーの一括登録**
```typescript
const users = [
  { name: 'ユーザー1', email: 'user1@example.com', age: 20 },
  { name: 'ユーザー2', email: 'user2@example.com', age: 25 },
  { name: 'ユーザー3', email: 'user3@example.com', age: 30 }
]

// 各ユーザーのINSERT文を準備
const statements = users.map(user =>
  c.env.DB.prepare('INSERT INTO users (name, email, age, createdAt) VALUES (?, ?, ?, ?)')
    .bind(user.name, user.email, user.age, new Date().toISOString())
)

// トランザクションとして一括実行
const results = await c.env.DB.batch(statements)

// すべて成功した場合
console.log(`${results.length} 件のユーザーを登録しました`)

// もし1件でも失敗したら、全てロールバックされます
```

**トランザクションの重要性を理解する例：**

```typescript
// ❌ トランザクションなしの場合
try {
  await c.env.DB.prepare('INSERT INTO users ...').bind(...).run()  // ✅ 成功
  await c.env.DB.prepare('INSERT INTO logs ...').bind(...).run()   // ❌ 失敗
  // 問題: ユーザーは登録されたが、ログは記録されない（不整合）
} catch (error) {
  // 1番目の操作は巻き戻せない
}

// ✅ トランザクションありの場合
try {
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO users ...').bind(...),
    c.env.DB.prepare('INSERT INTO logs ...').bind(...)
  ])
  // すべて成功するか、すべて失敗する（整合性が保たれる）
} catch (error) {
  // 両方の操作が自動的にロールバックされる
}
```

---

## 5. 配列操作とSQLの対応

このセクションでは、JavaScriptの配列操作とSQLクエリの対応関係を学びます。

### 5.1 全件取得

**配列版：**
```typescript
// usersは配列
const allUsers = users
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users').all()
const allUsers = result.results
```

**SQL解説：**
- `SELECT *`: すべてのカラムを選択
- `FROM users`: usersテーブルから
- 条件なし: すべての行を取得

### 5.2 ID検索（完全一致）

**配列版：**
```typescript
const user = users.find(u => u.id === 123)
```

**D1版：**
```typescript
const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(123)
  .first()
```

**SQL解説：**
- `WHERE id = ?`: idカラムが指定した値と一致する行
- `first()`: 1件だけ取得（IDはユニークなので）

### 5.3 名前検索（部分一致）

**配列版：**
```typescript
const users = allUsers.filter(u => u.name.includes('太郎'))
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users WHERE name LIKE ?')
  .bind('%太郎%')
  .all()
const users = result.results
```

**SQL解説：**
- `LIKE`: 部分一致検索
- `%太郎%`:
  - `%` = 任意の文字列（0文字以上）
  - `太郎` = 検索したい文字列
  - 例: '山田太郎', '太郎ちゃん', '太郎' すべてマッチ
- `太郎%`: 「太郎」で始まる（前方一致）
- `%太郎`: 「太郎」で終わる（後方一致）

### 5.4 年齢範囲検索

**配列版：**
```typescript
const users = allUsers.filter(u => u.age >= 20 && u.age <= 30)
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users WHERE age >= ? AND age <= ?')
  .bind(20, 30)
  .all()
const users = result.results
```

**SQL解説：**
- `AND`: 複数条件の論理積（両方とも真）
- `>=`: 以上
- `<=`: 以下

**別の書き方（BETWEEN）：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users WHERE age BETWEEN ? AND ?')
  .bind(20, 30)
  .all()
```

### 5.5 新規追加

**配列版：**
```typescript
const newUser = {
  id: nextId++,
  name: '新規ユーザー',
  email: 'new@example.com',
  age: 25,
  createdAt: new Date().toISOString()
}
users.push(newUser)
```

**D1版：**
```typescript
const result = await c.env.DB.prepare(`
  INSERT INTO users (name, email, age, createdAt)
  VALUES (?, ?, ?, ?)
`).bind('新規ユーザー', 'new@example.com', 25, new Date().toISOString())
  .run()

const userId = result.meta.last_row_id
```

**SQL解説：**
- `INSERT INTO users`: usersテーブルに挿入
- `(name, email, age, createdAt)`: 挿入するカラムのリスト
- `VALUES (?, ?, ?, ?)`: 挿入する値（プレースホルダー）
- `id` は `AUTOINCREMENT` なので自動生成される

### 5.6 更新

**配列版：**
```typescript
const userIndex = users.findIndex(u => u.id === 123)
if (userIndex !== -1) {
  users[userIndex].name = '更新後の名前'
  users[userIndex].age = 26
}
```

**D1版：**
```typescript
await c.env.DB.prepare('UPDATE users SET name = ?, age = ? WHERE id = ?')
  .bind('更新後の名前', 26, 123)
  .run()
```

**SQL解説：**
- `UPDATE users`: usersテーブルを更新
- `SET name = ?, age = ?`: 更新するカラムと値
- `WHERE id = ?`: 更新対象の行を指定（必須！）

**⚠️ 警告：WHERE句を忘れると全行が更新されます！**
```sql
-- ❌ 危険！全ユーザーの名前が同じになる
UPDATE users SET name = '太郎'

-- ✅ 安全：特定のユーザーだけ更新
UPDATE users SET name = '太郎' WHERE id = 123
```

### 5.7 削除

**配列版：**
```typescript
const userIndex = users.findIndex(u => u.id === 123)
if (userIndex !== -1) {
  users.splice(userIndex, 1)
}
```

**D1版：**
```typescript
await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
  .bind(123)
  .run()
```

**SQL解説：**
- `DELETE FROM users`: usersテーブルから削除
- `WHERE id = ?`: 削除対象の行を指定（必須！）

**⚠️ 警告：WHERE句を忘れると全行が削除されます！**
```sql
-- ❌ 危険！全ユーザーが削除される
DELETE FROM users

-- ✅ 安全：特定のユーザーだけ削除
DELETE FROM users WHERE id = 123
```

### 5.8 件数取得

**配列版：**
```typescript
const count = users.length
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
const count = result.count
```

**SQL解説：**
- `COUNT(*)`: 行数をカウント
- `as count`: 結果のカラム名を `count` に指定

### 5.9 ソート（並び替え）

**配列版：**
```typescript
const sorted = users.sort((a, b) => b.age - a.age)  // 年齢降順
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users ORDER BY age DESC').all()
const sorted = result.results
```

**SQL解説：**
- `ORDER BY age`: ageカラムで並び替え
- `DESC`: 降順（Descending = 大きい順）
- `ASC`: 昇順（Ascending = 小さい順、デフォルト）

**複数カラムでソート：**
```sql
SELECT * FROM users ORDER BY age DESC, name ASC
-- 年齢降順、同じ年齢なら名前昇順
```

### 5.10 リミット（上位N件）

**配列版：**
```typescript
const top5 = users.slice(0, 5)
```

**D1版：**
```typescript
const result = await c.env.DB.prepare('SELECT * FROM users LIMIT ?')
  .bind(5)
  .all()
const top5 = result.results
```

**SQL解説：**
- `LIMIT 5`: 最初の5件だけ取得

**ページネーション（ページング）：**
```typescript
// 1ページ目（1〜10件）
const page1 = await c.env.DB.prepare('SELECT * FROM users LIMIT 10 OFFSET 0').all()

// 2ページ目（11〜20件）
const page2 = await c.env.DB.prepare('SELECT * FROM users LIMIT 10 OFFSET 10').all()

// 汎用的な実装
const page = 2  // 取得したいページ番号
const perPage = 10
const offset = (page - 1) * perPage
const result = await c.env.DB.prepare('SELECT * FROM users LIMIT ? OFFSET ?')
  .bind(perPage, offset)
  .all()
```

---

## 6. 実践例：users-api.tsの移行

このセクションでは、実際に `users-api.ts` の各エンドポイントをD1版に書き換える方法を解説します。

**参考実装：** `src/examples/users-api-with-d1.ts` に完全なコードがあります。

### 6.1 全ユーザー取得（GET /users）

**現在のコード（80-86行目）：**
```typescript
app.get('/users', (c) => {
  const response: ApiResponse<User[]> = {
    success: true,
    data: users  // メモリ内配列
  }
  return c.json(response)
})
```

**D1版への変更：**
```typescript
app.get('/users', async (c) => {  // async を追加
  try {
    // データベースから全ユーザーを取得
    const result = await c.env.DB.prepare('SELECT * FROM users').all()

    const response: ApiResponse<User[]> = {
      success: true,
      data: result.results as User[]
    }
    return c.json(response)
  } catch (error) {
    console.error('Database error:', error)

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'ユーザー一覧の取得に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `async` キーワードを追加（非同期処理のため）
2. `await c.env.DB.prepare(...).all()` でデータベースから取得
3. `try-catch` でエラーハンドリング
4. `result.results` から実際のデータを取得

### 6.2 ID検索（GET /users/:id）

**現在のコード（120-140行目）：**
```typescript
app.get('/users/:id', (c) => {
  const id = Number(c.req.param('id'))
  const user = users.find(u => u.id === id)  // 配列検索

  if (!user) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`
      }
    }
    return c.json(errorResponse, 404)
  }

  const response: ApiResponse<User> = {
    success: true,
    data: user
  }
  return c.json(response)
})
```

**D1版への変更：**
```typescript
app.get('/users/:id', async (c) => {  // async を追加
  try {
    const id = Number(c.req.param('id'))

    // データベースから特定ユーザーを取得
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`
        }
      }
      return c.json(errorResponse, 404)
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user as User
    }
    return c.json(response)
  } catch (error) {
    console.error('Get user error:', error)

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'ユーザーの取得に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `users.find()` → `c.env.DB.prepare(...).first()`
2. `first()` は `null` を返す可能性があるので、同じ `if (!user)` チェックでOK
3. `try-catch` でデータベースエラーをハンドリング

### 6.3 新規作成（POST /users）

**現在のコード（144-187行目）：**
```typescript
app.post('/users', async (c) => {
  try {
    const body = await c.req.json<CreateUserInput>()

    // バリデーション
    if (!body.name || !body.email || !body.age) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, email, age は必須です'
        }
      }
      return c.json(errorResponse, 400)
    }

    // 新しいユーザーを作成（配列に追加）
    const newUser: User = {
      id: nextId++,
      name: body.name,
      email: body.email,
      age: body.age,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)

    const response: ApiResponse<User> = {
      success: true,
      data: newUser
    }
    return c.json(response, 201)
  } catch (error) {
    // ...
  }
})
```

**D1版への変更：**
```typescript
app.post('/users', async (c) => {
  try {
    const body = await c.req.json<CreateUserInput>()

    // バリデーション（同じ）
    if (!body.name || !body.email || !body.age) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, email, age は必須です'
        }
      }
      return c.json(errorResponse, 400)
    }

    // 年齢の範囲チェック
    if (body.age < 0 || body.age > 150) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_AGE',
          message: '年齢は0〜150の範囲で指定してください'
        }
      }
      return c.json(errorResponse, 400)
    }

    const createdAt = new Date().toISOString()

    // データベースに挿入
    const result = await c.env.DB.prepare(`
      INSERT INTO users (name, email, age, createdAt)
      VALUES (?, ?, ?, ?)
    `).bind(body.name, body.email, body.age, createdAt)
      .run()

    // 挿入されたユーザーのIDを取得
    const userId = result.meta.last_row_id

    // 挿入したユーザーを取得（確認用）
    const newUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first()

    const response: ApiResponse<User> = {
      success: true,
      data: newUser as User
    }
    return c.json(response, 201)
  } catch (error: any) {
    console.error('Create user error:', error)

    // UNIQUE制約違反の特別処理
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'このメールアドレスは既に登録されています'
        }
      }
      return c.json(errorResponse, 409)
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'ユーザーの作成に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `users.push()` → `INSERT INTO` SQL
2. `nextId++` → `result.meta.last_row_id` で自動生成されたIDを取得
3. UNIQUE制約違反（重複メールアドレス）のエラー処理を追加

### 6.4 更新（PUT /users/:id）

**現在のコード（191-229行目）：**
```typescript
app.put('/users/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userIndex = users.findIndex(u => u.id === id)

  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`
      }
    }
    return c.json(errorResponse, 404)
  }

  try {
    const body = await c.req.json<Partial<CreateUserInput>>()

    // 既存のデータを更新
    if (body.name) users[userIndex].name = body.name
    if (body.email) users[userIndex].email = body.email
    if (body.age) users[userIndex].age = body.age

    const response: ApiResponse<User> = {
      success: true,
      data: users[userIndex]
    }
    return c.json(response)
  } catch (error) {
    // ...
  }
})
```

**D1版への変更：**
```typescript
app.put('/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))

    // ユーザーの存在確認
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    if (!existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`
        }
      }
      return c.json(errorResponse, 404)
    }

    const body = await c.req.json<UpdateUserInput>()

    // 動的にUPDATE文を構築（指定されたフィールドのみ更新）
    const updates: string[] = []
    const params: any[] = []

    if (body.name !== undefined) {
      updates.push('name = ?')
      params.push(body.name)
    }
    if (body.email !== undefined) {
      updates.push('email = ?')
      params.push(body.email)
    }
    if (body.age !== undefined) {
      if (body.age < 0 || body.age > 150) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'INVALID_AGE',
            message: '年齢は0〜150の範囲で指定してください'
          }
        }
        return c.json(errorResponse, 400)
      }
      updates.push('age = ?')
      params.push(body.age)
    }

    if (updates.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: '更新するフィールドが指定されていません'
        }
      }
      return c.json(errorResponse, 400)
    }

    // SQL文を構築して実行
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    await c.env.DB.prepare(sql).bind(...params).run()

    // 更新後のユーザーを取得
    const updatedUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser as User
    }
    return c.json(response)
  } catch (error: any) {
    console.error('Update user error:', error)

    // UNIQUE制約違反の処理
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'このメールアドレスは既に使用されています'
        }
      }
      return c.json(errorResponse, 409)
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'ユーザーの更新に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `users.findIndex()` → SELECT で存在確認
2. 配列の直接更新 → 動的にUPDATE文を構築
3. 更新後のデータを再度SELECT で取得

### 6.5 削除（DELETE /users/:id）

**現在のコード（233-258行目）：**
```typescript
app.delete('/users/:id', (c) => {
  const id = Number(c.req.param('id'))
  const userIndex = users.findIndex(u => u.id === id)

  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`
      }
    }
    return c.json(errorResponse, 404)
  }

  // 配列から削除
  users.splice(userIndex, 1)

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: `ID ${id} のユーザーを削除しました`
    }
  }
  return c.json(response)
})
```

**D1版への変更：**
```typescript
app.delete('/users/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))

    // ユーザーの存在確認
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    if (!existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`
        }
      }
      return c.json(errorResponse, 404)
    }

    // DELETE実行
    const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(id)
      .run()

    // 削除された行数を確認
    const rowsDeleted = result.meta.rows_written || 0
    if (rowsDeleted === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'ユーザーの削除に失敗しました'
        }
      }
      return c.json(errorResponse, 500)
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: `ID ${id} のユーザーを削除しました`
      }
    }
    return c.json(response)
  } catch (error) {
    console.error('Delete user error:', error)

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'ユーザーの削除に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `users.splice()` → `DELETE FROM` SQL
2. `result.meta.rows_written` で削除された行数を確認

### 6.6 検索（GET /users/search）

**現在のコード（91-116行目）：**
```typescript
app.get('/users/search', (c) => {
  const name = c.req.query('name')
  const ageMin = c.req.query('ageMin')
  const ageMax = c.req.query('ageMax')

  let filteredUsers = users

  // 名前で検索（部分一致）
  if (name) {
    filteredUsers = filteredUsers.filter(u => u.name.includes(name))
  }

  // 年齢での絞り込み
  if (ageMin) {
    filteredUsers = filteredUsers.filter(u => u.age >= Number(ageMin))
  }
  if (ageMax) {
    filteredUsers = filteredUsers.filter(u => u.age <= Number(ageMax))
  }

  const response: ApiResponse<User[]> = {
    success: true,
    data: filteredUsers
  }
  return c.json(response)
})
```

**D1版への変更：**
```typescript
app.get('/users/search', async (c) => {
  try {
    const name = c.req.query('name')
    const ageMin = c.req.query('ageMin')
    const ageMax = c.req.query('ageMax')

    // 動的にSQLクエリを構築
    let sql = 'SELECT * FROM users WHERE 1=1'  // 1=1 は常に真（条件追加を簡単にする）
    const params: any[] = []

    // 名前での絞り込み（部分一致）
    if (name) {
      sql += ' AND name LIKE ?'
      params.push(`%${name}%`)  // % はワイルドカード
    }

    // 年齢の下限
    if (ageMin) {
      sql += ' AND age >= ?'
      params.push(Number(ageMin))
    }

    // 年齢の上限
    if (ageMax) {
      sql += ' AND age <= ?'
      params.push(Number(ageMax))
    }

    // クエリ実行
    let stmt = c.env.DB.prepare(sql)
    if (params.length > 0) {
      stmt = stmt.bind(...params)
    }

    const result = await stmt.all()

    const response: ApiResponse<User[]> = {
      success: true,
      data: result.results as User[]
    }
    return c.json(response)
  } catch (error) {
    console.error('Search error:', error)

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'ユーザー検索に失敗しました'
      }
    }
    return c.json(errorResponse, 500)
  }
})
```

**変更ポイント：**
1. `filter()` の連鎖 → 動的にWHERE句を構築
2. `includes()` → `LIKE` 演算子
3. 複数条件を `AND` で結合

---

## 7. エラーハンドリング

データベース操作では、さまざまなエラーが発生する可能性があります。適切にハンドリングすることで、ユーザーにわかりやすいエラーメッセージを表示できます。

### 7.1 D1特有のエラー

#### UNIQUE制約違反

**エラー例：**
```
Error: UNIQUE constraint failed: users.email
```

**原因：**
- 既に存在するメールアドレスで新規ユーザーを登録しようとした

**ハンドリング例：**
```typescript
try {
  await c.env.DB.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')
    .bind('太郎', 'taro@example.com', 25)
    .run()
} catch (error: any) {
  if (error.message && error.message.includes('UNIQUE constraint failed')) {
    return c.json({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'このメールアドレスは既に登録されています'
      }
    }, 409)  // 409 Conflict
  }
  throw error  // 他のエラーは再スロー
}
```

#### CHECK制約違反

**エラー例：**
```
Error: CHECK constraint failed: users
```

**原因：**
- CHECK(age >= 0 AND age <= 150) に違反する値を挿入した

**ハンドリング例：**
```typescript
// 事前にバリデーションで防ぐ方が良い
if (age < 0 || age > 150) {
  return c.json({
    success: false,
    error: {
      code: 'INVALID_AGE',
      message: '年齢は0〜150の範囲で指定してください'
    }
  }, 400)
}
```

#### NOT NULL制約違反

**エラー例：**
```
Error: NOT NULL constraint failed: users.name
```

**原因：**
- 必須項目に NULL を挿入しようとした

**ハンドリング例：**
```typescript
// 事前にバリデーションで防ぐ
if (!body.name || !body.email || !body.age) {
  return c.json({
    success: false,
    error: {
      code: 'MISSING_REQUIRED_FIELDS',
      message: 'name, email, age は必須です'
    }
  }, 400)
}
```

### 7.2 推奨エラーハンドリングパターン

**基本構造：**
```typescript
app.post('/users', async (c) => {
  try {
    // 1. バリデーション（早期リターン）
    const body = await c.req.json<CreateUserInput>()
    if (!body.name || !body.email || !body.age) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, email, age は必須です'
        }
      }, 400)
    }

    // 2. データベース操作
    const result = await c.env.DB.prepare('INSERT INTO users ...')
      .bind(...)
      .run()

    // 3. 成功レスポンス
    return c.json({
      success: true,
      data: ...
    }, 201)

  } catch (error: any) {
    // 4. エラーログ
    console.error('Create user error:', error)

    // 5. 特定エラーの処理
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'このメールアドレスは既に登録されています'
        }
      }, 409)
    }

    // 6. 一般的なエラー
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ユーザーの作成に失敗しました'
      }
    }, 500)
  }
})
```

### 7.3 HTTPステータスコード一覧

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | OK | 取得・更新・削除成功 |
| 201 | Created | 新規作成成功 |
| 400 | Bad Request | 入力エラー、バリデーション失敗 |
| 404 | Not Found | リソースが見つからない |
| 409 | Conflict | リソースの競合（UNIQUE制約違反） |
| 500 | Internal Server Error | サーバー内部エラー |

---

## 8. ベストプラクティス

### 8.1 SQLインジェクション対策（超重要！）

**❌ 絶対にやってはいけないこと：**
```typescript
// 危険！ユーザー入力を直接SQL文に埋め込む
const userId = c.req.query('id')  // '1 OR 1=1' のような悪意ある入力の可能性
const stmt = c.env.DB.prepare(`SELECT * FROM users WHERE id = ${userId}`)
```

**もし `userId` が `'1 OR 1=1'` だった場合：**
```sql
SELECT * FROM users WHERE id = 1 OR 1=1
-- 1=1 は常に真なので、全ユーザーのデータが漏洩！
```

**✅ 正しい方法：プレースホルダーとbind()を使う**
```typescript
const userId = c.req.query('id')
const stmt = c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId)
// bind() が安全にエスケープしてくれる
```

**複数パラメータの場合：**
```typescript
const name = c.req.query('name')
const age = c.req.query('age')

// ✅ 正しい
const stmt = c.env.DB.prepare('SELECT * FROM users WHERE name = ? AND age = ?')
  .bind(name, age)

// ❌ 危険
const stmt = c.env.DB.prepare(`SELECT * FROM users WHERE name = '${name}' AND age = ${age}`)
```

### 8.2 トランザクションの活用

**複数の関連操作は、トランザクションでまとめる：**

```typescript
// 例：ユーザー登録とログ記録を同時に行う
try {
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)')
      .bind('太郎', 'taro@example.com', 25),
    c.env.DB.prepare('INSERT INTO logs (action, timestamp) VALUES (?, ?)')
      .bind('user_created', new Date().toISOString())
  ])
  // 両方成功するか、両方失敗する
} catch (error) {
  // エラーが発生したら、両方の操作が自動的にロールバックされる
}
```

### 8.3 インデックスの活用

**頻繁に検索するカラムにはインデックスを作成：**

```sql
-- メールアドレスでの検索が頻繁なので
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 名前での検索も多いので
CREATE INDEX idx_users_name ON users(name);
```

**インデックスの効果：**
- 検索が高速になる（特にデータ件数が多い場合）
- ただし、INSERT/UPDATE/DELETE は少し遅くなる（インデックスも更新する必要があるため）

### 8.4 ページネーション（大量データ対策）

**一度に全データを取得しない：**

```typescript
// ❌ データが10万件あったら大変
const result = await c.env.DB.prepare('SELECT * FROM users').all()

// ✅ ページごとに取得
const page = Number(c.req.query('page')) || 1
const perPage = 20
const offset = (page - 1) * perPage

const result = await c.env.DB.prepare('SELECT * FROM users LIMIT ? OFFSET ?')
  .bind(perPage, offset)
  .all()

// ページ総数も返す
const countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM users').first()
const totalPages = Math.ceil(countResult.total / perPage)

return c.json({
  success: true,
  data: result.results,
  pagination: {
    currentPage: page,
    perPage: perPage,
    totalPages: totalPages,
    total: countResult.total
  }
})
```

### 8.5 N+1問題の回避

**N+1問題とは：**
- ループの中でデータベースクエリを実行すること
- 非常に遅くなる

**❌ 悪い例：**
```typescript
const users = await c.env.DB.prepare('SELECT * FROM users').all()

// 各ユーザーの投稿数を取得（N+1問題発生）
for (const user of users.results) {
  const posts = await c.env.DB.prepare('SELECT COUNT(*) FROM posts WHERE user_id = ?')
    .bind(user.id)
    .first()
  user.postCount = posts.count
}
// ユーザーが100人いたら、101回のクエリ（1 + 100）
```

**✅ 良い例：JOIN または一括取得**
```typescript
// JOINで1回のクエリで取得
const result = await c.env.DB.prepare(`
  SELECT
    users.*,
    COUNT(posts.id) as postCount
  FROM users
  LEFT JOIN posts ON users.id = posts.user_id
  GROUP BY users.id
`).all()
// 1回のクエリで完了
```

---

## 9. デバッグとトラブルシューティング

### 9.1 よくある問題と解決方法

#### 問題1: `DB is not defined`

**エラーメッセージ：**
```
ReferenceError: DB is not defined
```

**原因：**
- `wrangler.jsonc` にD1の設定がない
- または、型定義が正しくない

**解決方法：**
1. `wrangler.jsonc` を確認
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "my-user-database",
       "database_id": "xxxxx"
     }
   ]
   ```

2. 型定義を確認
   ```typescript
   type Bindings = {
     DB: D1Database
   }
   const app = new Hono<{ Bindings: Bindings }>()
   ```

3. サーバーを再起動
   ```bash
   npm run dev
   ```

#### 問題2: `no such table: users`

**エラーメッセージ：**
```
Error: no such table: users
```

**原因：**
- スキーマ（schema.sql）が適用されていない

**解決方法：**
```bash
wrangler d1 execute my-user-database --local --file=./schema.sql
```

#### 問題3: `UNIQUE constraint failed: users.email`

**エラーメッセージ：**
```
Error: UNIQUE constraint failed: users.email
```

**原因：**
- 既に存在するメールアドレスで登録しようとした

**解決方法：**
- 別のメールアドレスを使用する
- または、既存のユーザーを更新する
- コード側でUNIQUE制約エラーをハンドリングする（7.1参照）

#### 問題4: データが保存されない（ローカル環境）

**原因：**
- `--local` フラグなしでスキーマを適用した
- または、ローカルDBファイルが破損している

**解決方法：**
```bash
# ローカルDBを削除して再作成
rm -rf .wrangler/state/v3/d1/
wrangler d1 execute my-user-database --local --file=./schema.sql
```

### 9.2 デバッグ方法

#### 方法1: console.log()でクエリ結果を確認

```typescript
app.get('/users', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM users').all()

  // デバッグ出力
  console.log('Query result:', result)
  console.log('Number of users:', result.results.length)

  return c.json(result.results)
})
```

#### 方法2: wrangler CLIで直接SQL実行

```bash
# データを確認
wrangler d1 execute my-user-database --local --command="SELECT * FROM users;"

# テーブル構造を確認
wrangler d1 execute my-user-database --local --command="PRAGMA table_info(users);"

# インデックスを確認
wrangler d1 execute my-user-database --local --command="SELECT * FROM sqlite_master WHERE type='index';"
```

#### 方法3: ローカルDBファイルを直接確認

ローカルDBの場所：
```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/{database-id}.sqlite
```

SQLiteクライアント（例: DB Browser for SQLite）で開いて確認できます。

### 9.3 トラブルシューティングチェックリスト

問題が発生したら、以下を順番にチェック：

- [ ] `wrangler.jsonc` にD1設定があるか
- [ ] `database_id` が正しいか
- [ ] `schema.sql` が適用されているか（`--local` フラグ付き）
- [ ] 型定義（Bindings）が正しいか
- [ ] サーバーを再起動したか
- [ ] SQLクエリの構文は正しいか
- [ ] プレースホルダー（?）とbind()の数が一致しているか
- [ ] `await` キーワードを忘れていないか
- [ ] `async` 関数になっているか

---

## 10. ローカル開発と本番環境

### 10.1 ローカル開発環境

**開発サーバーの起動：**
```bash
npm run dev
```

これにより、自動的に `--local` フラグが適用され、ローカルのD1データベースが使用されます。

**ローカルDB削除のファイルの場所：**
```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/{database-id}.sqlite
```

**ローカルDBの初期化：**
```bash
# ローカルDBを削除
rm -rf .wrangler/state/v3/d1/

# スキーマを再適用
wrangler d1 execute my-user-database --local --file=./schema.sql
```

### 10.2 本番環境へのデプロイ

#### ステップ1: 本番DBにスキーマを適用（初回のみ）

```bash
wrangler d1 execute my-user-database --file=./schema.sql
```

**注意：** `--local` フラグを**付けない**ことで、本番DBに適用されます。

#### ステップ2: アプリをデプロイ

```bash
npm run deploy
```

または

```bash
wrangler deploy
```

#### ステップ3: 動作確認

デプロイが完了すると、URLが表示されます：
```
Published my-app (0.37 sec)
  https://my-app.your-subdomain.workers.dev
```

curlでテスト：
```bash
curl https://my-app.your-subdomain.workers.dev/api/v1/users
```

### 10.3 ローカルと本番の違い

| 項目 | ローカル | 本番 |
|------|----------|------|
| **データベース** | `.wrangler/` フォルダ | Cloudflareクラウド |
| **データ** | 開発用テストデータ | 実際のユーザーデータ |
| **コマンド** | `--local` フラグ付き | `--local` フラグなし |
| **URL** | `http://localhost:8787` | `https://xxx.workers.dev` |
| **スキーマ変更** | 何度でも気軽に | 慎重に（データ損失の可能性） |

**重要：** ローカルと本番は完全に別のデータベースです。データは同期されません。

### 10.4 本番データの管理

#### データのバックアップ

```bash
# 本番データをSQLファイルとしてエクスポート
wrangler d1 export my-user-database --output=backup.sql

# または、本番データをローカルに複製
wrangler d1 execute my-user-database --command="SELECT * FROM users;" > users_backup.json
```

#### データの移行

**本番からローカルへ：**
```bash
# 1. 本番データをエクスポート
wrangler d1 export my-user-database --output=prod_data.sql

# 2. ローカルにインポート
wrangler d1 execute my-user-database --local --file=prod_data.sql
```

**ローカルから本番へ（注意！）：**
```bash
# 警告：本番データを上書きします！
wrangler d1 execute my-user-database --file=local_data.sql
```

### 10.5 スキーマ変更（マイグレーション）

本番環境でスキーマを変更する際の注意点：

#### 安全な変更（データ損失なし）

```sql
-- カラムの追加（既存データは保持される）
ALTER TABLE users ADD COLUMN phone TEXT;

-- インデックスの追加
CREATE INDEX idx_users_phone ON users(phone);
```

#### 危険な変更（データ損失の可能性）

```sql
-- テーブルの削除（全データが消える）
DROP TABLE users;

-- カラムの削除（そのカラムのデータが消える）
ALTER TABLE users DROP COLUMN age;
```

**推奨手順（本番スキーマ変更）：**

1. **ローカルでテスト**
   ```bash
   wrangler d1 execute my-user-database --local --file=migration.sql
   ```

2. **バックアップを取得**
   ```bash
   wrangler d1 export my-user-database --output=backup_before_migration.sql
   ```

3. **本番に適用**
   ```bash
   wrangler d1 execute my-user-database --file=migration.sql
   ```

4. **動作確認**
   ```bash
   curl https://your-app.workers.dev/api/v1/users
   ```

---

## 11. 次のステップ

D1の基礎を理解したら、次に学ぶべきトピック：

### 11.1 リレーション（外部キー）

**複数テーブルの関連付け：**

```sql
-- postsテーブルを作成
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**TypeScriptでの使用：**
```typescript
// ユーザーとその投稿を一緒に取得
const result = await c.env.DB.prepare(`
  SELECT
    users.*,
    posts.id as post_id,
    posts.title,
    posts.content
  FROM users
  INNER JOIN posts ON users.id = posts.user_id
  WHERE users.id = ?
`).bind(userId).all()
```

### 11.2 JOIN（テーブルの結合）

**INNER JOIN：**
```sql
SELECT users.name, posts.title
FROM users
INNER JOIN posts ON users.id = posts.user_id;
```

**LEFT JOIN：**
```sql
SELECT users.name, COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON users.id = posts.user_id
GROUP BY users.id;
```

### 11.3 高度なクエリ

**集計関数：**
```sql
-- 平均年齢
SELECT AVG(age) as average_age FROM users;

-- 最年長
SELECT MAX(age) as max_age FROM users;

-- 年齢別のユーザー数
SELECT age, COUNT(*) as count FROM users GROUP BY age;
```

**サブクエリ：**
```sql
-- 平均年齢以上のユーザー
SELECT * FROM users
WHERE age >= (SELECT AVG(age) FROM users);
```

### 11.4 パフォーマンス最適化

**EXPLAIN QUERY PLAN：**
```sql
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'taro@example.com';
```

**インデックスの最適化：**
```sql
-- 複合インデックス
CREATE INDEX idx_users_age_name ON users(age, name);
```

### 11.5 セキュリティ強化

**認証とアクセス制御：**
- JWTトークンによる認証
- ユーザーごとのアクセス制限
- レートリミット（DDoS対策）

### 11.6 テスト

**Vitest でのテスト：**
```typescript
import { describe, it, expect } from 'vitest'
import app from './users-api'

describe('GET /users', () => {
  it('全ユーザーを返す', async () => {
    const res = await app.request('/users')
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

---

## まとめ

このチュートリアルでは、以下を学びました：

✅ **データベースの基礎** - なぜメモリ内配列では不十分なのか
✅ **Cloudflare Workers D1** - 特徴と他のデータベースとの違い
✅ **セットアップ** - D1データベースの作成から設定まで
✅ **D1 API** - prepare(), bind(), all(), first(), run(), batch()
✅ **配列とSQLの対応** - 配列操作をSQLクエリに変換する方法
✅ **実践例** - users-api.ts の各エンドポイントをD1版に移行
✅ **エラーハンドリング** - UNIQUE制約違反などの適切な処理
✅ **ベストプラクティス** - SQLインジェクション対策、トランザクション
✅ **デバッグ** - よくある問題と解決方法
✅ **デプロイ** - ローカル開発と本番環境の違い

---

## 参考リソース

**公式ドキュメント：**
- [Cloudflare Workers D1](https://developers.cloudflare.com/d1/)
- [Hono - Cloudflare Workers](https://hono.dev/getting-started/cloudflare-workers)
- [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

**学習リソース：**
- [SQLite チュートリアル](https://www.sqlitetutorial.net/)
- [SQL基礎](https://www.w3schools.com/sql/)

**コミュニティ：**
- [Hono Discord](https://discord.gg/hono)
- [Cloudflare Developers Discord](https://discord.gg/cloudflaredev)

---

**🎉 これで Cloudflare Workers D1 データベース連携チュートリアルは完です！**

実際にコードを書いて、データベースを触ってみることで、より深く理解できます。
分からないことがあれば、公式ドキュメントやコミュニティで質問してみましょう！

Happy Coding! 🚀
