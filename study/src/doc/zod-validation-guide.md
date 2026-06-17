# 🛡️ Zod & @hono/zod-validator 完全ガイド

このドキュメントは、TypeScriptのバリデーションライブラリ「Zod」と、Hono専用ミドルウェア「@hono/zod-validator」について、初学者向けに解説します。

---

## 📖 目次

1. [Zodとは](#zodとは)
2. [なぜZodが必要か](#なぜzodが必要か)
3. [Zodの基本文法](#zodの基本文法)
4. [@hono/zod-validatorとは](#honovalidatorとは)
5. [実践例](#実践例)
6. [プロジェクトへの導入手順](#プロジェクトへの導入手順)
7. [よくあるパターン](#よくあるパターン)

---

## Zodとは

**Zod** = TypeScript専用のスキーマバリデーションライブラリ

### 簡単に言うと

- **実行時に型チェックしてくれる道具**
- TypeScriptの型定義 + バリデーション機能を1つで実現

### 身近な例え

Zodは「空港の荷物検査官」のようなもの：

```typescript
// ❌ 普通のTypeScript（検査なし）
interface 荷物 {
  重さ: number
  中身: string
}

// 荷物を受け取る
const 受け取った荷物: 荷物 = 外部から来た何か
// 問題：本当に荷物？重さは数字？中身は何？
```

```typescript
// ✅ Zod（しっかり検査）
import { z } from 'zod'

const 荷物検査ルール = z.object({
  重さ: z.number().max(20, "20kg以内"),
  中身: z.string()
})

const 検査結果 = 荷物検査ルール.safeParse(外部から来た何か)

if (検査結果.success) {
  console.log("✅ 検査OK", 検査結果.data)
} else {
  console.log("❌ NG", 検査結果.error)
}
```

---

## なぜZodが必要か

### TypeScriptの型の限界

```typescript
interface Todo {
  id: number
  title: string
  completed: boolean
}

// コンパイル時は OK
const todo: Todo = {
  id: 1,
  title: "買い物",
  completed: false
}

// でも実行時は...？
const data = JSON.parse('{"id": "文字列", "title": 123}')
const todo2: Todo = data  
// ❌ 型エラーは出ないが、実行時にバグる！
```

**問題点：**
- TypeScriptの型は**コンパイル時（ビルド時）**だけチェック
- **実行時（サーバー起動後）**はチェックしない
- 外部データ（API、DB、ユーザー入力）は信頼できない

### Zodの解決策

```typescript
import { z } from 'zod'

// スキーマ定義（型 + バリデーション）
const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
})

// 型を自動生成
type Todo = z.infer<typeof TodoSchema>

// 実行時バリデーション
const result = TodoSchema.safeParse(data)

if (result.success) {
  console.log(result.data)  // ✅ 型安全なデータ
} else {
  console.error(result.error)  // ❌ エラー詳細
}
```

---

## Zodの基本文法

### 1. プリミティブ型

```typescript
import { z } from 'zod'

// 基本型
const StringSchema = z.string()
const NumberSchema = z.number()
const BooleanSchema = z.boolean()
const DateSchema = z.date()

// 検証
StringSchema.parse("こんにちは")  // ✅ OK
StringSchema.parse(123)           // ❌ エラー
```

### 2. オブジェクト

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),     // メール形式チェック
  age: z.number().optional()      // オプション（省略可能）
})

// 型を自動生成
type User = z.infer<typeof UserSchema>
// ↓ これと同じ型
// {
//   id: number
//   name: string
//   email: string
//   age?: number
// }
```

### 3. 配列

```typescript
const TodoListSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string()
  })
)

type TodoList = z.infer<typeof TodoListSchema>
// ↓ { id: number, title: string }[]
```

### 4. バリデーションルール

```typescript
const TodoSchema = z.object({
  title: z.string()
    .min(1, "titleは必須です")
    .max(100, "titleは100文字以下です"),
  
  description: z.string().optional(),
  
  priority: z.number()
    .min(1)
    .max(5),  // 1〜5の範囲
  
  email: z.string().email("メール形式が不正です"),
  
  url: z.string().url("URL形式が不正です")
})
```

### 5. 検証方法

```typescript
// safeParse: エラーを返す（推奨）
const result = TodoSchema.safeParse(data)

if (result.success) {
  console.log(result.data)    // 検証済みデータ
} else {
  console.log(result.error)   // エラー詳細
}

// parse: エラーを投げる
try {
  const todo = TodoSchema.parse(data)
  console.log(todo)
} catch (error) {
  console.error(error)
}
```

---

## @hono/zod-validatorとは

**Hono専用のZodミドルウェア**  
= バリデーションを自動化してくれるツール

### インストール

```bash
npm install zod @hono/zod-validator
```

### 何が便利？

#### Before（手動バリデーション）

```typescript
// controller.ts
export const createTodoHandler = async (c: Context) => {
  const body = await c.req.json()
  
  // バリデーション（長い...）
  const validation = validateCreateTodoDto(body)
  if (!validation.isValid) {
    return c.json({ 
      error: 'バリデーションエラー', 
      details: validation.errors 
    }, 400)
  }
  
  // やっと使える
  const newTodo = await todoService.createNewTodo(
    validation.data!.title,
    validation.data!.description
  )
  
  return c.json({ data: newTodo }, 201)
}
```

#### After（@hono/zod-validator使用）

```typescript
// types.ts
import { z } from 'zod'

export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional()
})

// routes.ts
import { zValidator } from '@hono/zod-validator'

todoRoutes.post(
  '/create',
  zValidator('json', CreateTodoSchema),  // ← これだけ！
  createTodoHandler
)

// controller.ts（超シンプル！）
export const createTodoHandler = async (c: Context) => {
  // ✅ ここに来た時点でバリデーション済み！
  const body = c.req.valid('json')
  
  const newTodo = await todoService.createNewTodo(
    body.title,
    body.description
  )
  
  return c.json({ data: newTodo }, 201)
}
```

---

## 実践例

### 例1：Todo作成（POST /todos）

```typescript
// types.ts
import { z } from 'zod'

export const CreateTodoSchema = z.object({
  title: z.string()
    .min(1, "titleは必須です")
    .max(100, "titleは100文字以下にしてください"),
  
  description: z.string().optional()
})

export type CreateTodoDto = z.infer<typeof CreateTodoSchema>
```

```typescript
// routes.ts
import { zValidator } from '@hono/zod-validator'
import { CreateTodoSchema } from './types'

todoRoutes.post(
  '/create',
  zValidator('json', CreateTodoSchema),
  createTodoHandler
)
```

```typescript
// controller.ts
export const createTodoHandler = async (c: Context) => {
  const { title, description } = c.req.valid('json')
  
  const newTodo = await todoService.createNewTodo(title, description)
  
  return c.json({ data: newTodo }, 201)
}
```

---

### 例2：Todo更新（PUT /todos/:id）

```typescript
// types.ts
// URLパラメータ用スキーマ
export const TodoParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, "IDは数値です")
    .transform(Number)  // 文字列→数値に変換
})

// リクエストボディ用スキーマ
export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  completed: z.boolean()
})
```

```typescript
// routes.ts
todoRoutes.put(
  '/:id',
  zValidator('param', TodoParamSchema),  // パラメータ検証
  zValidator('json', UpdateTodoSchema),  // ボディ検証
  updateTodoHandler
)
```

```typescript
// controller.ts
export const updateTodoHandler = async (c: Context) => {
  // 両方とも型安全！
  const { id } = c.req.valid('param')       // { id: number }
  const body = c.req.valid('json')          // { title: string, ... }
  
  const updatedTodo = await todoService.updateTodo(
    id,
    body.title,
    body.description,
    body.completed
  )
  
  return c.json({ data: updatedTodo })
}
```

---

### 例3：クエリパラメータ（GET /todos?completed=true）

```typescript
// types.ts
export const TodoQuerySchema = z.object({
  completed: z.enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),  // 文字列→booleanに変換
  
  page: z.string()
    .optional()
    .transform(val => Number(val) || 1)
    .default('1'),
  
  limit: z.string()
    .optional()
    .transform(val => Number(val) || 10)
    .default('10')
})
```

```typescript
// routes.ts
todoRoutes.get(
  '/',
  zValidator('query', TodoQuerySchema),
  getAllTodos
)
```

```typescript
// controller.ts
export const getAllTodos = async (c: Context) => {
  const { completed, page, limit } = c.req.valid('query')
  
  const todos = await todoService.findAllTodos({
    completed,  // boolean | undefined
    page,       // number
    limit       // number
  })
  
  return c.json({ data: todos })
}
```

---

## プロジェクトへの導入手順

### ステップ1：インストール

```bash
npm install zod @hono/zod-validator
```

### ステップ2：スキーマ定義

```typescript
// src/features/todos/types.ts
import { z } from 'zod'

// ベーススキーマ
export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export type Todo = z.infer<typeof TodoSchema>

// リクエスト用スキーマ
export const CreateTodoSchema = TodoSchema.omit({
  id: true,
  completed: true,
  createdAt: true,
  updatedAt: true
})

export const UpdateTodoSchema = TodoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
```

### ステップ3：ルートに適用

```typescript
// src/features/todos/routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateTodoSchema, UpdateTodoSchema } from './types'
import * as controller from './controller'

export const todoRoutes = new Hono()

todoRoutes.get('/', controller.getAllTodos)

todoRoutes.post(
  '/create',
  zValidator('json', CreateTodoSchema),
  controller.createTodoHandler
)

todoRoutes.put(
  '/:id',
  zValidator('json', UpdateTodoSchema),
  controller.updateTodoHandler
)
```

### ステップ4：コントローラーで使用

```typescript
// src/features/todos/controller.ts
import { Context } from 'hono'
import * as todoService from './service'

export const createTodoHandler = async (c: Context) => {
  const body = c.req.valid('json')
  
  const newTodo = await todoService.createNewTodo(
    body.title,
    body.description
  )
  
  return c.json({ data: newTodo }, 201)
}
```

---

## よくあるパターン

### 1. データ変換（transform）

```typescript
// 文字列→数値
const QuerySchema = z.object({
  page: z.string().transform(Number),
  limit: z.string().transform(Number)
})

// SQLite: 0/1 → boolean
const TodoSchema = z.object({
  completed: z.number().transform(val => val === 1)
})

// 文字列→Date
const EventSchema = z.object({
  date: z.string().transform(str => new Date(str))
})
```

### 2. デフォルト値

```typescript
const FilterSchema = z.object({
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().default(10)
})

// クエリパラメータがなくても動く
// GET /todos → { sortBy: 'createdAt', order: 'asc', limit: 10 }
```

### 3. カスタム検証（refine）

```typescript
const CreateTodoSchema = z.object({
  title: z.string(),
  dueDate: z.string().datetime()
}).refine(data => {
  // カスタムルール：dueDateは未来の日付
  const due = new Date(data.dueDate)
  return due > new Date()
}, {
  message: "期限は未来の日付を指定してください",
  path: ["dueDate"]
})
```

### 4. スキーマの再利用（pick/omit/extend）

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  createdAt: z.string()
})

// 一部だけ取り出す
const LoginSchema = UserSchema.pick({ email: true, password: true })

// 一部を除外
const UserResponseSchema = UserSchema.omit({ password: true })

// 拡張
const AdminUserSchema = UserSchema.extend({
  role: z.enum(['admin', 'superadmin'])
})
```

### 5. エラーメッセージのカスタマイズ

```typescript
const CreateTodoSchema = z.object({
  title: z.string({
    required_error: "titleは必須項目です",
    invalid_type_error: "titleは文字列でなければなりません"
  })
    .min(1, "titleは1文字以上必要です")
    .max(100, "titleは100文字以内にしてください"),
  
  email: z.string().email("正しいメール形式で入力してください")
})
```

### 6. エラーハンドリングのカスタマイズ

```typescript
import { zValidator } from '@hono/zod-validator'

todoRoutes.post(
  '/create',
  zValidator('json', CreateTodoSchema, (result, c) => {
    if (!result.success) {
      // カスタムエラーレスポンス
      return c.json({
        error: 'バリデーションエラー',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        })),
        statuscode: 400
      }, 400)
    }
  }),
  createTodoHandler
)
```

---

## 検証する場所の種類

`zValidator`の第1引数で指定できる場所：

| 場所 | 説明 | 例 |
|------|------|-----|
| `'json'` | リクエストボディ（JSON） | `POST /todos` のボディ |
| `'param'` | URLパラメータ | `/todos/:id` の `:id` |
| `'query'` | クエリパラメータ | `/todos?completed=true` |
| `'header'` | HTTPヘッダー | `Authorization` など |
| `'form'` | フォームデータ | `multipart/form-data` |

### 使用例

```typescript
// JSON
zValidator('json', z.object({ title: z.string() }))

// パラメータ
zValidator('param', z.object({ id: z.string() }))

// クエリ
zValidator('query', z.object({ page: z.string() }))

// ヘッダー
zValidator('header', z.object({ 
  'authorization': z.string() 
}))
```

---

## 比較表：Before vs After

| 項目 | Before（手動） | After（zValidator） |
|------|----------------|-------------------|
| **コード量** | 長い（20行以上） | 短い（1行） |
| **型安全性** | `!` が必要 | 完全に型安全 |
| **エラー処理** | 毎回書く | 自動 |
| **保守性** | 変更が面倒 | スキーマだけ変更 |
| **可読性** | ごちゃごちゃ | すっきり |
| **テスト** | 難しい | スキーマを単体テスト可能 |

---

## 学習ステップ

### ステップ1：Zodだけ試す（5分）

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number()
})

const result = schema.safeParse({ name: "太郎", age: 20 })
console.log(result)
```

### ステップ2：@hono/zod-validatorを試す（10分）

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const schema = z.object({
  name: z.string()
})

app.post('/hello', zValidator('json', schema), (c) => {
  const { name } = c.req.valid('json')
  return c.json({ message: `Hello, ${name}!` })
})

export default app
```

### ステップ3：プロジェクトに導入（30分）

1. `npm install zod @hono/zod-validator`
2. `types.ts` にスキーマ定義
3. `routes.ts` で `zValidator` 使用
4. `controller.ts` で `c.req.valid()` 使用

---

## まとめ

### Zodを使うべき理由

✅ **実行時の型安全性**  
TypeScriptの型チェックは**ビルド時のみ**。Zodは**実行時も**チェックしてくれる。

✅ **外部データの検証**  
API、DB、ユーザー入力など、信頼できないデータを安全に扱える。

✅ **DRY原則**  
型定義とバリデーションを1箇所で管理できる。

✅ **わかりやすいエラー**  
どこが間違っているか詳細に教えてくれる。

### @hono/zod-validatorを使うべき理由

✅ **コードが短くなる**  
バリデーションコードを**自動化**して、コントローラーがシンプルに。

✅ **保守性が上がる**  
スキーマを変更するだけで、全体に反映される。

✅ **型安全**  
`c.req.valid()` で完全に型安全なデータが取得できる。

---

## 参考リンク

- [Zod公式ドキュメント](https://zod.dev/)
- [Hono公式ドキュメント](https://hono.dev/)
- [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)

---

## 次のステップ

Zodをマスターしたら、次は以下を学ぶと良いでしょう：

1. **テストコード** - Zodスキーマの単体テスト
2. **エラーハンドリング** - グローバルエラーハンドラー
3. **ミドルウェア** - 認証、ロギングなど
4. **OpenAPI** - Zodスキーマから自動生成

---

**作成日**: 2026-04-06  
**対象**: TypeScript/Hono初学者  
**バージョン**: Zod ^3.x, @hono/zod-validator ^0.x
