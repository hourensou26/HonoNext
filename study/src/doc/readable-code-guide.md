# リーダブルコード & プロジェクト構成ガイド

大規模プロジェクトで使われる、読みやすく保守しやすいコードの書き方とプロジェクト構成について、初学者向けに詳しく解説します。

**このガイドの対象読者：**
- プログラミング初学者〜中級者
- チーム開発を始める方
- コードレビューで指摘を受けることが多い方
- より良いコードを書きたい方

**参考書籍：**
- 『リーダブルコード』（Dustin Boswell, Trevor Foucher 著）
- 『Clean Code』（Robert C. Martin 著）
- 『Clean Architecture』（Robert C. Martin 著）

---

## 目次

1. [リーダブルコードの原則](#1-リーダブルコードの原則)
2. [命名規則](#2-命名規則)
3. [関数・メソッドの設計](#3-関数メソッドの設計)
4. [コメントの書き方](#4-コメントの書き方)
5. [リファクタリング手法](#5-リファクタリング手法)
6. [ディレクトリ構成](#6-ディレクトリ構成)
7. [ファイル分割戦略](#7-ファイル分割戦略)
8. [大規模プロジェクトの構成例](#8-大規模プロジェクトの構成例)
9. [TypeScript/Hono 実践例](#9-typescripthono-実践例)
10. [コードレビューのポイント](#10-コードレビューのポイント)

---

## 1. リーダブルコードの原則

### 1.1 リーダブルコードとは？

**リーダブルコード（Readable Code）**とは、他人が読んで理解しやすいコードのことです。

**なぜ重要なのか？**
- コードは**書く時間の10倍**、読まれる時間がある
- チーム開発では、他の人があなたのコードを読む
- 半年後の自分は「他人」（自分でも忘れる）
- バグ修正や機能追加が容易になる

**用語解説：**
- **保守性（Maintainability）**: コードの変更・修正のしやすさ
- **可読性（Readability）**: コードの読みやすさ・理解しやすさ
- **拡張性（Extensibility）**: 新しい機能を追加しやすいか

### 1.2 コードは「書く」ものではなく「書き残す」もの

**悪い考え方：**
```
「とりあえず動けばOK」
「後で直せばいい」
「自分しか触らないから適当でいい」
```

**良い考え方：**
```
「未来の自分が読んで理解できるか？」
「チームメンバーが理解できるか？」
「1年後も保守できるか？」
```

### 1.3 リーダブルコードの4原則

#### 原則1: 表面上の改善

**理解するまでにかかる時間を最小限にする**

```typescript
// ❌ 悪い例：変数名が短すぎる
let d = new Date()
let t = d.getTime()

// ✅ 良い例：意味が分かる
let currentDate = new Date()
let timestamp = currentDate.getTime()
```

#### 原則2: ループとロジックの単純化

**複雑なロジックを分割して理解しやすくする**

```typescript
// ❌ 悪い例：複雑な条件
if (user.age >= 18 && user.isActive && !user.isBanned && user.emailVerified) {
  // ...
}

// ✅ 良い例：意図が明確な関数
function canAccessContent(user: User): boolean {
  return user.age >= 18 &&
         user.isActive &&
         !user.isBanned &&
         user.emailVerified
}

if (canAccessContent(user)) {
  // ...
}
```

#### 原則3: コードの再構成

**似たような処理をまとめる**

```typescript
// ❌ 悪い例：重複したコード
const user1 = await db.prepare('SELECT * FROM users WHERE id = ?').bind(1).first()
const user2 = await db.prepare('SELECT * FROM users WHERE id = ?').bind(2).first()
const user3 = await db.prepare('SELECT * FROM users WHERE id = ?').bind(3).first()

// ✅ 良い例：関数化
async function getUserById(id: number): Promise<User | null> {
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
}

const user1 = await getUserById(1)
const user2 = await getUserById(2)
const user3 = await getUserById(3)
```

#### 原則4: 「未完成」のタスクを示す

```typescript
// TODO: エラーハンドリングを追加
// FIXME: この処理は非効率なので後で修正
// HACK: 一時的な対応、本来は別の方法で実装すべき
// XXX: 危険なコード、要注意
```

**用語解説：**
- **TODO**: これから実装する必要がある機能
- **FIXME**: 既知の問題、修正が必要
- **HACK**: 汚い実装、後で綺麗にする予定
- **XXX**: 非常に危険なコード、注意が必要

---

## 2. 命名規則

### 2.1 命名の重要性

> 「コンピュータサイエンスには2つの難しい問題しかない。キャッシュの無効化と命名だ」
> — Phil Karlton

**良い名前の条件：**
1. 目的が明確
2. 誤解されない
3. 長すぎず、短すぎない
4. チーム内で統一されている

### 2.2 変数名の付け方

#### 一般的なルール

```typescript
// ❌ 悪い例：意味不明
let d = 86400
let tmp = data.filter(x => x > 10)

// ✅ 良い例：意図が明確
let secondsPerDay = 86400
let validUsers = users.filter(user => user.age > 10)
```

#### 真偽値（boolean）の命名

**接頭辞を使う：**`is`, `has`, `can`, `should`

```typescript
// ✅ 良い命名
let isActive = true
let hasPermission = false
let canDelete = user.role === 'admin'
let shouldRetry = errorCount < 3
let isLoading = false
let hasError = false
```

**❌ 避けるべき命名：**
```typescript
let active = true       // isActive の方が明確
let permission = false  // hasPermission の方が明確
let status = true       // 何の状態？不明確
```

#### 数値の命名

**単位を明示する：**

```typescript
// ❌ 悪い例：単位が不明
let timeout = 3000

// ✅ 良い例：単位を含める
let timeoutMs = 3000           // ミリ秒
let timeoutSeconds = 3         // 秒
let maxRetryCount = 5          // 回数
let pageSizeLimit = 100        // 件数
```

#### コレクション（配列）の命名

**複数形を使う：**

```typescript
// ✅ 良い命名
let users: User[] = []
let productList: Product[] = []
let errorMessages: string[] = []

// イテレータの命名
for (const user of users) {    // 単数形
  console.log(user.name)
}

users.forEach(user => {        // 単数形
  processUser(user)
})
```

### 2.3 関数名の付け方

#### 動詞から始める

```typescript
// ✅ 良い命名
function getUser(id: number): User { }
function createUser(data: CreateUserInput): User { }
function updateUser(id: number, data: UpdateUserInput): User { }
function deleteUser(id: number): void { }
function validateEmail(email: string): boolean { }
function calculateTotal(items: Item[]): number { }
function fetchUserData(): Promise<User[]> { }
```

#### よく使われる動詞

| 動詞 | 意味 | 例 |
|------|------|-----|
| **get** | 取得（同期） | `getUser()` |
| **fetch** | 取得（非同期） | `fetchUsers()` |
| **set** | 設定 | `setName()` |
| **update** | 更新 | `updateProfile()` |
| **create** | 作成 | `createPost()` |
| **delete** / **remove** | 削除 | `deletePost()` |
| **is** / **has** / **can** | 真偽値を返す | `isValid()` |
| **calculate** | 計算 | `calculateTotal()` |
| **validate** | 検証 | `validateInput()` |
| **find** | 検索（1件） | `findUserById()` |
| **filter** | 絞り込み | `filterActiveUsers()` |
| **parse** | 解析・変換 | `parseJSON()` |
| **format** | 整形 | `formatDate()` |
| **handle** | 処理・対応 | `handleError()` |
| **init** / **initialize** | 初期化 | `initDatabase()` |

### 2.4 ケーススタイル（命名規則の種類）

#### camelCase（キャメルケース）

**使用場所：** 変数名、関数名、メソッド名

```typescript
let firstName = '太郎'
let isActive = true
function getUserName() { }
```

#### PascalCase（パスカルケース）

**使用場所：** クラス名、インターフェース名、型名

```typescript
class User { }
interface UserProfile { }
type ApiResponse = { }
```

#### snake_case（スネークケース）

**使用場所：** データベースのカラム名、環境変数

```typescript
// データベース
// created_at, first_name, is_active

// 環境変数
const API_KEY = process.env.API_KEY
const DATABASE_URL = process.env.DATABASE_URL
```

#### UPPER_SNAKE_CASE（アッパースネークケース）

**使用場所：** 定数

```typescript
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_TIMEOUT_MS = 5000
```

#### kebab-case（ケバブケース）

**使用場所：** ファイル名、URL

```
user-profile.ts
api-client.ts
/api/user-settings
```

### 2.5 命名のアンチパターン

**避けるべき名前：**

```typescript
// ❌ 悪い例
let data = fetchData()           // 何のデータ？
let tmp = process(input)         // 一時的な何？
let result = calculate()         // 何の結果？
let flag = true                  // 何のフラグ？
let value = getValue()           // 何の値？
let info = getInfo()             // 何の情報？
let manager = new Manager()      // 何を管理？
let handler = new Handler()      // 何を処理？
let utils = new Utils()          // 何のユーティリティ？

// ✅ 良い例
let userData = fetchUserData()
let sanitizedInput = sanitize(input)
let calculatedTotal = calculateOrderTotal()
let isEmailVerified = true
let userAge = getUserAge()
let profileInfo = getProfileInfo()
let databaseManager = new DatabaseManager()
let errorHandler = new ErrorHandler()
let stringUtils = new StringUtils()
```

---

## 3. 関数・メソッドの設計

### 3.1 単一責任の原則（SRP: Single Responsibility Principle）

**1つの関数は1つのことだけを行う**

```typescript
// ❌ 悪い例：複数の責任
function processUserAndSendEmail(userId: number) {
  // ユーザー取得
  const user = getUserById(userId)

  // データ検証
  if (!user) throw new Error('User not found')
  if (!user.email) throw new Error('Email not found')

  // メール送信
  sendEmail(user.email, 'Welcome!', 'Thank you for signing up')

  // ログ記録
  console.log(`Email sent to ${user.email}`)

  // データベース更新
  updateUserStatus(userId, 'email_sent')
}

// ✅ 良い例：責任を分割
async function sendWelcomeEmailToUser(userId: number): Promise<void> {
  const user = await validateUser(userId)
  await sendWelcomeEmail(user)
  await markEmailAsSent(userId)
  logEmailSent(user.email)
}

async function validateUser(userId: number): Promise<User> {
  const user = await getUserById(userId)
  if (!user) throw new Error('User not found')
  if (!user.email) throw new Error('Email not found')
  return user
}

async function sendWelcomeEmail(user: User): Promise<void> {
  await sendEmail(user.email, 'Welcome!', 'Thank you for signing up')
}

async function markEmailAsSent(userId: number): Promise<void> {
  await updateUserStatus(userId, 'email_sent')
}

function logEmailSent(email: string): void {
  console.log(`Email sent to ${email}`)
}
```

**用語解説：**
- **単一責任の原則（SRP）**: クラスや関数は1つの責任だけを持つべき
- **責任（Responsibility）**: その関数やクラスが変更される理由

### 3.2 関数は短く保つ

**目安：**
- 1関数は20行以内が理想
- 最大でも50行以内
- 画面1つ分（スクロールせずに見える範囲）

```typescript
// ❌ 悪い例：長すぎる関数（100行以上）
function processOrder(orderId: number) {
  // 注文取得
  const order = getOrder(orderId)

  // 在庫確認
  for (const item of order.items) {
    const stock = getStock(item.productId)
    if (stock < item.quantity) {
      // 在庫不足処理...
    }
  }

  // 価格計算
  let total = 0
  for (const item of order.items) {
    total += item.price * item.quantity
  }

  // 割引適用
  if (order.couponCode) {
    const discount = getCouponDiscount(order.couponCode)
    total -= discount
  }

  // ... 以下100行続く
}

// ✅ 良い例：小さな関数に分割
async function processOrder(orderId: number): Promise<ProcessedOrder> {
  const order = await getOrder(orderId)
  await validateStock(order)
  const total = calculateOrderTotal(order)
  const payment = await processPayment(order, total)
  await updateInventory(order)
  await sendConfirmationEmail(order)

  return {
    orderId,
    total,
    paymentId: payment.id,
    status: 'completed'
  }
}
```

### 3.3 引数は少なく（3個以内が理想）

```typescript
// ❌ 悪い例：引数が多すぎる
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string,
  isActive: boolean
) {
  // ...
}

// ✅ 良い例：オブジェクトにまとめる
interface CreateUserParams {
  name: string
  email: string
  age: number
  address: string
  phone: string
  role: string
  isActive: boolean
}

function createUser(params: CreateUserParams) {
  // ...
}

// 使用例
createUser({
  name: '太郎',
  email: 'taro@example.com',
  age: 25,
  address: '東京都',
  phone: '090-1234-5678',
  role: 'user',
  isActive: true
})
```

### 3.4 副作用を避ける（Pure Function）

**純粋関数（Pure Function）**とは：
1. 同じ引数なら常に同じ結果を返す
2. 外部の状態を変更しない

```typescript
// ❌ 悪い例：副作用がある（グローバル変数を変更）
let totalPrice = 0

function addToCart(price: number) {
  totalPrice += price  // 外部の状態を変更
}

// ✅ 良い例：純粋関数
function calculateNewTotal(currentTotal: number, price: number): number {
  return currentTotal + price  // 外部の状態を変更せず、新しい値を返す
}

// 使用例
let totalPrice = 0
totalPrice = calculateNewTotal(totalPrice, 1000)
```

### 3.5 早期リターン（Early Return）

**ネストを減らし、可読性を向上させる**

```typescript
// ❌ 悪い例：ネストが深い
function getDiscount(user: User): number {
  if (user) {
    if (user.isPremium) {
      if (user.totalPurchases > 10000) {
        return 0.2
      } else {
        return 0.1
      }
    } else {
      return 0.05
    }
  } else {
    return 0
  }
}

// ✅ 良い例：早期リターン
function getDiscount(user: User | null): number {
  if (!user) return 0
  if (!user.isPremium) return 0.05
  if (user.totalPurchases > 10000) return 0.2
  return 0.1
}
```

---

## 4. コメントの書き方

### 4.1 コメントの基本原則

**コメントの目的：**
- コードの「なぜ」を説明する（「何を」はコード自体が説明すべき）
- 複雑なアルゴリズムの解説
- 注意事項や制約の明示

**良いコメントの例：**

```typescript
// ✅ 良い例：「なぜ」を説明
// タイムアウトを3秒に設定（APIが2秒以内に応答することが保証されているため）
const TIMEOUT_MS = 3000

// 商品の在庫数から予約数を引く
// 注意: 在庫数が負の値になることもある（予約過多の場合）
const availableStock = product.stock - product.reservations

// パフォーマンス向上のため、結果を30分キャッシュする
// 商品データは頻繁に変更されないため、この期間で問題ない
const CACHE_DURATION_MS = 30 * 60 * 1000
```

### 4.2 不要なコメント（削除すべき）

```typescript
// ❌ 悪い例：コードを繰り返しているだけ
// ユーザーの名前を取得
const name = user.name

// 年齢が18以上かチェック
if (age >= 18) {
  // ...
}

// iを1増やす
i++

// ✅ 良い例：コードが自己説明的
const userName = user.name
if (isAdult(age)) {
  // ...
}
i++
```

### 4.3 JSDoc / TSDoc スタイル

**関数やクラスのドキュメント化：**

```typescript
/**
 * ユーザーをIDで検索します
 *
 * @param userId - 検索するユーザーのID
 * @returns ユーザーオブジェクト、見つからない場合はnull
 * @throws {DatabaseError} データベース接続エラー
 *
 * @example
 * ```typescript
 * const user = await getUserById(123)
 * if (user) {
 *   console.log(user.name)
 * }
 * ```
 */
async function getUserById(userId: number): Promise<User | null> {
  // 実装
}

/**
 * ユーザー情報を表すインターフェース
 */
interface User {
  /** ユーザーの一意識別子 */
  id: number

  /** ユーザー名（2文字以上50文字以下） */
  name: string

  /** メールアドレス（一意制約あり） */
  email: string

  /** 年齢（0〜150の範囲） */
  age: number

  /** アカウント作成日時（ISO 8601形式） */
  createdAt: string
}
```

### 4.4 TODO / FIXME / HACK コメント

```typescript
// TODO: エラーハンドリングを追加
// TODO(taro): キャッシュ機能を実装（期限: 2026-04-30）
function fetchData() {
  // ...
}

// FIXME: この処理は非効率（N+1問題が発生している）
function loadUsersWithPosts() {
  // ...
}

// HACK: 一時的な対応。本来はAPIを修正すべき
function workaroundForBuggyAPI() {
  // ...
}

// XXX: 危険：この関数は副作用がある
function dangerousFunction() {
  // ...
}
```

---

## 5. リファクタリング手法

### 5.1 リファクタリングとは？

**リファクタリング（Refactoring）**とは：
- 外部から見た動作を変えずに、コードの内部構造を改善すること
- コードの可読性、保守性、拡張性を向上させる

**リファクタリングの原則：**
1. テストを書いてから行う（動作が変わっていないことを確認）
2. 小さなステップで少しずつ行う
3. 各ステップでテストを実行して確認

**用語解説：**
- **レガシーコード（Legacy Code）**: テストがなく、変更が怖いコード
- **テクニカルデット（Technical Debt）**: 将来的に修正が必要な、品質の低いコード

### 5.2 マジックナンバーの排除

**マジックナンバー（Magic Number）**とは：
意味が不明な数値リテラル

```typescript
// ❌ 悪い例：マジックナンバー
if (user.age >= 18) { }
setTimeout(() => { }, 3000)
const tax = price * 0.1

// ✅ 良い例：定数に名前を付ける
const ADULT_AGE = 18
const TIMEOUT_MS = 3000
const TAX_RATE = 0.1

if (user.age >= ADULT_AGE) { }
setTimeout(() => { }, TIMEOUT_MS)
const tax = price * TAX_RATE
```

### 5.3 重複コードの削除（DRY原則）

**DRY（Don't Repeat Yourself）**: 同じコードを繰り返さない

```typescript
// ❌ 悪い例：重複コード
function createUser(data: CreateUserInput) {
  if (!data.name) throw new Error('Name is required')
  if (!data.email) throw new Error('Email is required')
  if (!data.age) throw new Error('Age is required')
  // ...
}

function updateUser(id: number, data: UpdateUserInput) {
  if (!data.name) throw new Error('Name is required')
  if (!data.email) throw new Error('Email is required')
  if (!data.age) throw new Error('Age is required')
  // ...
}

// ✅ 良い例：共通化
function validateUserData(data: Partial<User>): void {
  if (!data.name) throw new Error('Name is required')
  if (!data.email) throw new Error('Email is required')
  if (!data.age) throw new Error('Age is required')
}

function createUser(data: CreateUserInput) {
  validateUserData(data)
  // ...
}

function updateUser(id: number, data: UpdateUserInput) {
  validateUserData(data)
  // ...
}
```

### 5.4 条件分岐の簡略化

#### ガード節（Guard Clause）

```typescript
// ❌ 悪い例
function processUser(user: User | null) {
  if (user !== null) {
    if (user.isActive) {
      if (user.emailVerified) {
        // 実際の処理
        sendEmail(user)
      }
    }
  }
}

// ✅ 良い例
function processUser(user: User | null) {
  if (!user) return
  if (!user.isActive) return
  if (!user.emailVerified) return

  sendEmail(user)
}
```

#### ポリモーフィズム（多態性）

```typescript
// ❌ 悪い例：条件分岐が多い
function calculateShippingCost(type: string, weight: number): number {
  if (type === 'standard') {
    return weight * 100
  } else if (type === 'express') {
    return weight * 200 + 500
  } else if (type === 'overnight') {
    return weight * 300 + 1000
  }
  return 0
}

// ✅ 良い例：ストラテジーパターン
interface ShippingStrategy {
  calculate(weight: number): number
}

class StandardShipping implements ShippingStrategy {
  calculate(weight: number): number {
    return weight * 100
  }
}

class ExpressShipping implements ShippingStrategy {
  calculate(weight: number): number {
    return weight * 200 + 500
  }
}

class OvernightShipping implements ShippingStrategy {
  calculate(weight: number): number {
    return weight * 300 + 1000
  }
}

// 使用例
const strategies: Record<string, ShippingStrategy> = {
  standard: new StandardShipping(),
  express: new ExpressShipping(),
  overnight: new OvernightShipping()
}

function calculateShippingCost(type: string, weight: number): number {
  const strategy = strategies[type]
  return strategy ? strategy.calculate(weight) : 0
}
```

### 5.5 関数の抽出

```typescript
// ❌ 悪い例：長い関数
function renderOrder(order: Order) {
  console.log('=== 注文詳細 ===')
  console.log(`注文ID: ${order.id}`)
  console.log(`顧客名: ${order.customerName}`)
  console.log('--- 商品一覧 ---')
  for (const item of order.items) {
    console.log(`${item.name}: ${item.price}円 x ${item.quantity}`)
  }
  let total = 0
  for (const item of order.items) {
    total += item.price * item.quantity
  }
  console.log(`合計: ${total}円`)
}

// ✅ 良い例：関数を抽出
function renderOrder(order: Order) {
  renderOrderHeader(order)
  renderOrderItems(order.items)
  renderOrderTotal(order.items)
}

function renderOrderHeader(order: Order) {
  console.log('=== 注文詳細 ===')
  console.log(`注文ID: ${order.id}`)
  console.log(`顧客名: ${order.customerName}`)
}

function renderOrderItems(items: OrderItem[]) {
  console.log('--- 商品一覧 ---')
  for (const item of items) {
    console.log(`${item.name}: ${item.price}円 x ${item.quantity}`)
  }
}

function renderOrderTotal(items: OrderItem[]) {
  const total = calculateTotal(items)
  console.log(`合計: ${total}円`)
}

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
```

---

## 6. ディレクトリ構成

### 6.1 ディレクトリ構成の原則

**良いディレクトリ構成の条件：**
1. **明確な構造**: どこに何があるか一目でわかる
2. **スケーラブル**: 機能が増えても破綻しない
3. **一貫性**: プロジェクト全体で統一されている
4. **関心の分離**: 責務ごとに分かれている

### 6.2 フロントエンド（React/Next.js）の構成例

#### 小規模プロジェクト

```
my-app/
├── public/              # 静的ファイル
│   ├── images/
│   └── fonts/
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   └── Card/
│   ├── pages/           # ページコンポーネント
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── hooks/           # カスタムフック
│   │   ├── useAuth.ts
│   │   └── useFetch.ts
│   ├── utils/           # ユーティリティ関数
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types/           # 型定義
│   │   └── index.ts
│   ├── api/             # API呼び出し
│   │   └── client.ts
│   └── App.tsx
├── package.json
└── tsconfig.json
```

#### 大規模プロジェクト（Feature-based）

```
my-app/
├── src/
│   ├── features/            # 機能ごとにまとめる
│   │   ├── auth/            # 認証機能
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── SignupForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── user/            # ユーザー機能
│   │   │   ├── components/
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   └── UserList.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useUser.ts
│   │   │   └── index.ts
│   │   └── product/         # 商品機能
│   │       ├── components/
│   │       ├── hooks/
│   │       └── index.ts
│   ├── shared/              # 共通
│   │   ├── components/      # 共通コンポーネント
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Modal/
│   │   ├── hooks/           # 共通フック
│   │   ├── utils/           # 共通ユーティリティ
│   │   └── types/           # 共通型定義
│   ├── layouts/             # レイアウトコンポーネント
│   │   ├── MainLayout.tsx
│   │   └── AdminLayout.tsx
│   ├── pages/               # ページ
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/              # ルーティング
│   │   └── index.tsx
│   ├── store/               # 状態管理（Redux/Zustand等）
│   │   ├── authSlice.ts
│   │   └── userSlice.ts
│   ├── config/              # 設定ファイル
│   │   └── constants.ts
│   └── App.tsx
├── tests/                   # テスト
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
└── tsconfig.json
```

**用語解説：**
- **Feature-based**: 機能単位でディレクトリを分ける方法
- **Layer-based**: 層（コンポーネント、フック、APIなど）単位で分ける方法

### 6.3 バックエンド（Node.js/Hono）の構成例

#### 小規模プロジェクト

```
my-api/
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── routes/           # ルート定義
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── index.ts
│   ├── controllers/      # リクエスト処理
│   │   ├── userController.ts
│   │   └── postController.ts
│   ├── services/         # ビジネスロジック
│   │   ├── userService.ts
│   │   └── postService.ts
│   ├── models/           # データモデル・型定義
│   │   ├── User.ts
│   │   └── Post.ts
│   ├── middleware/       # ミドルウェア
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── utils/            # ユーティリティ
│   │   └── validation.ts
│   └── config/           # 設定
│       └── database.ts
├── tests/
├── package.json
└── tsconfig.json
```

#### 大規模プロジェクト（Clean Architecture）

```
my-api/
├── src/
│   ├── domain/                  # ドメイン層（ビジネスロジック）
│   │   ├── entities/            # エンティティ
│   │   │   ├── User.ts
│   │   │   └── Post.ts
│   │   ├── repositories/        # リポジトリインターフェース
│   │   │   ├── IUserRepository.ts
│   │   │   └── IPostRepository.ts
│   │   └── services/            # ドメインサービス
│   │       ├── UserService.ts
│   │       └── PostService.ts
│   ├── application/             # アプリケーション層（ユースケース）
│   │   ├── use-cases/
│   │   │   ├── user/
│   │   │   │   ├── CreateUser.ts
│   │   │   │   ├── GetUser.ts
│   │   │   │   └── UpdateUser.ts
│   │   │   └── post/
│   │   │       ├── CreatePost.ts
│   │   │       └── GetPost.ts
│   │   └── dto/                 # データ転送オブジェクト
│   │       ├── CreateUserDto.ts
│   │       └── UserResponseDto.ts
│   ├── infrastructure/          # インフラ層（外部接続）
│   │   ├── database/
│   │   │   ├── repositories/    # リポジトリ実装
│   │   │   │   ├── UserRepository.ts
│   │   │   │   └── PostRepository.ts
│   │   │   └── connection.ts
│   │   ├── api/                 # 外部API
│   │   │   └── emailService.ts
│   │   └── cache/
│   │       └── redisClient.ts
│   ├── presentation/            # プレゼンテーション層（API）
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   ├── UserController.ts
│   │   │   │   └── PostController.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authentication.ts
│   │   │   │   └── validation.ts
│   │   │   └── routes/
│   │   │       ├── userRoutes.ts
│   │   │       ├── postRoutes.ts
│   │   │       └── index.ts
│   │   └── validators/
│   │       └── userValidator.ts
│   ├── shared/                  # 共通
│   │   ├── types/
│   │   ├── constants/
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── NotFoundError.ts
│   │   └── utils/
│   │       └── logger.ts
│   ├── config/                  # 設定
│   │   ├── app.ts
│   │   └── database.ts
│   └── index.ts                 # エントリーポイント
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                        # ドキュメント
├── scripts/                     # スクリプト
│   └── seed.ts
├── .env.example
├── package.json
└── tsconfig.json
```

**用語解説：**
- **Clean Architecture**: 層を分離して依存関係を制御するアーキテクチャ
- **ドメイン層（Domain Layer）**: ビジネスルールを含む中核部分
- **アプリケーション層（Application Layer）**: ユースケースを実装
- **インフラ層（Infrastructure Layer）**: データベースや外部APIとの接続
- **プレゼンテーション層（Presentation Layer）**: HTTPリクエストの処理
- **DTO（Data Transfer Object）**: 層間でデータを転送するためのオブジェクト

### 6.4 モノレポ（Monorepo）構成

**複数プロジェクトを1つのリポジトリで管理**

```
my-monorepo/
├── apps/                        # アプリケーション
│   ├── web/                     # フロントエンド（Next.js）
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   ├── mobile/                  # モバイルアプリ（React Native）
│   │   ├── src/
│   │   └── package.json
│   └── api/                     # バックエンド（Hono）
│       ├── src/
│       └── package.json
├── packages/                    # 共有パッケージ
│   ├── ui/                      # UI コンポーネント
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/                   # ユーティリティ
│   │   ├── src/
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   └── package.json
│   └── types/                   # 共通型定義
│       ├── src/
│       │   └── index.ts
│       └── package.json
├── tools/                       # 開発ツール
│   └── scripts/
├── docs/                        # ドキュメント
├── package.json                 # ルートのpackage.json
├── pnpm-workspace.yaml          # ワークスペース設定
└── tsconfig.base.json           # 共通のTypeScript設定
```

**メリット：**
- コードの共有が容易
- 一貫した開発環境
- 依存関係の管理が簡単

**ツール：**
- **pnpm workspaces**
- **Turborepo**
- **Nx**

---

## 7. ファイル分割戦略

### 7.1 ファイル分割の原則

**1ファイル = 1つの関心事**

```typescript
// ❌ 悪い例：すべて1ファイルに
// users.ts (500行)
interface User { }
interface CreateUserInput { }
interface UpdateUserInput { }

function validateUser() { }
function getUserById() { }
function createUser() { }
function updateUser() { }
function deleteUser() { }
// ... 以下続く

// ✅ 良い例：責務ごとにファイル分割
// types/User.ts
export interface User { }
export interface CreateUserInput { }
export interface UpdateUserInput { }

// validation/userValidation.ts
export function validateUser(user: User): boolean { }

// services/userService.ts
export function getUserById(id: number): Promise<User> { }
export function createUser(data: CreateUserInput): Promise<User> { }
export function updateUser(id: number, data: UpdateUserInput): Promise<User> { }
export function deleteUser(id: number): Promise<void> { }
```

### 7.2 index.ts による再エクスポート

**Barrel Export Pattern（バレルエクスポートパターン）**

```typescript
// components/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'

// components/Input/index.ts
export { Input } from './Input'
export type { InputProps } from './Input'

// components/index.ts
export * from './Button'
export * from './Input'
export * from './Card'

// 使用側
import { Button, Input, Card } from '@/components'
// components/index.ts から一括でインポートできる
```

### 7.3 ファイル命名規則

| ファイルの種類 | 命名規則 | 例 |
|---------------|---------|-----|
| コンポーネント | PascalCase | `UserProfile.tsx` |
| フック | camelCase（useXxx） | `useAuth.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |
| 型定義 | PascalCase | `User.ts` |
| 定数 | camelCase | `constants.ts` |
| テストファイル | 元のファイル名 + `.test` | `UserProfile.test.tsx` |
| ストーリー | 元のファイル名 + `.stories` | `Button.stories.tsx` |

### 7.4 相対パスと絶対パス

```typescript
// ❌ 悪い例：相対パスが長い
import { Button } from '../../../components/Button'
import { useAuth } from '../../../../hooks/useAuth'

// ✅ 良い例：絶対パス（エイリアス）
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
```

**tsconfig.json の設定：**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"]
    }
  }
}
```

---

## 8. 大規模プロジェクトの構成例

### 8.1 Google のスタイルガイド

**TypeScript Style Guide のポイント：**

1. **命名規則の統一**
   - クラス・インターフェース：`PascalCase`
   - 変数・関数：`camelCase`
   - 定数：`UPPER_SNAKE_CASE`
   - プライベートメンバー：`_prefix`

2. **1行は80文字以内**
   ```typescript
   // 長い関数呼び出しは改行
   const result = calculateComplexValue(
     firstParameter,
     secondParameter,
     thirdParameter
   )
   ```

3. **必ずセミコロンを付ける**
   ```typescript
   const name = 'Taro';  // ✅
   const age = 25;       // ✅
   ```

4. **型推論を活用**
   ```typescript
   // ✅ 型推論が効く場合は型注釈不要
   const name = 'Taro'  // string型と推論される

   // ✅ 明示的に型が必要な場合は書く
   const users: User[] = []
   ```

### 8.2 Airbnb のスタイルガイド

**JavaScript/React Style Guide のポイント：**

1. **アロー関数を優先**
   ```typescript
   // ✅ 良い
   const add = (a: number, b: number) => a + b

   // ❌ 避ける（特別な理由がない限り）
   function add(a: number, b: number) {
     return a + b
   }
   ```

2. **分割代入（Destructuring）を活用**
   ```typescript
   // ✅ 良い
   const { name, age } = user

   // ❌ 避ける
   const name = user.name
   const age = user.age
   ```

3. **テンプレートリテラルを使う**
   ```typescript
   // ✅ 良い
   const message = `Hello, ${name}!`

   // ❌ 避ける
   const message = 'Hello, ' + name + '!'
   ```

### 8.3 Netflix の構成（マイクロフロントエンド）

```
netflix-app/
├── packages/
│   ├── header/              # ヘッダーアプリ
│   │   ├── src/
│   │   └── package.json
│   ├── search/              # 検索アプリ
│   │   ├── src/
│   │   └── package.json
│   ├── player/              # プレイヤーアプリ
│   │   ├── src/
│   │   └── package.json
│   └── recommendations/     # おすすめアプリ
│       ├── src/
│       └── package.json
├── shared/
│   ├── ui-components/       # 共通UIコンポーネント
│   ├── api-client/          # APIクライアント
│   └── types/               # 共通型定義
└── shell/                   # メインアプリ（各アプリを統合）
    ├── src/
    └── package.json
```

**マイクロフロントエンド（Micro-Frontends）**とは：
- 大規模なフロントエンドを小さなアプリに分割
- 各チームが独立して開発・デプロイ
- スケーラビリティが高い

### 8.4 GitHub の構成

```
github-app/
├── app/                     # Railsアプリケーション
│   ├── models/              # データモデル
│   ├── controllers/         # コントローラー
│   ├── views/               # ビュー
│   └── services/            # ビジネスロジック
├── lib/                     # ライブラリ
├── config/                  # 設定ファイル
├── db/                      # データベース関連
│   ├── migrate/             # マイグレーション
│   └── seeds/               # 初期データ
├── test/                    # テスト
├── docs/                    # ドキュメント
├── scripts/                 # スクリプト
└── README.md
```

---

## 9. TypeScript/Hono 実践例

このプロジェクト（my-app）を大規模プロジェクト向けにリファクタリングする例を示します。

### 9.1 現在の構成の問題点

**現在：**
```
my-app/
├── src/
│   ├── index.ts                 # メインアプリ
│   ├── users-api.ts             # 全てのユーザーAPI（230行）
│   ├── tutorial.ts
│   ├── database-tutorial.md
│   └── examples/
│       └── users-api-with-d1.ts
└── schema.sql
```

**問題点：**
1. `users-api.ts` が1ファイルで230行（長すぎる）
2. すべてのロジックが1ファイルに集約（責務が分かれていない）
3. 型定義、バリデーション、ビジネスロジックが混在
4. 新しい機能（posts, comments など）を追加しづらい

### 9.2 リファクタリング後の構成

```
my-app/
├── src/
│   ├── index.ts                     # エントリーポイント
│   ├── features/                    # 機能ごとに分割
│   │   ├── users/
│   │   │   ├── routes.ts            # ルート定義
│   │   │   ├── controller.ts        # リクエスト処理
│   │   │   ├── service.ts           # ビジネスロジック
│   │   │   ├── repository.ts        # データアクセス
│   │   │   ├── types.ts             # 型定義
│   │   │   ├── validation.ts        # バリデーション
│   │   │   └── index.ts             # 再エクスポート
│   │   └── posts/
│   │       ├── routes.ts
│   │       ├── controller.ts
│   │       ├── service.ts
│   │       └── index.ts
│   ├── shared/                      # 共通
│   │   ├── types/
│   │   │   ├── ApiResponse.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── logger.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   └── database/
│   │       ├── client.ts
│   │       └── types.ts
│   └── config/
│       └── constants.ts
├── tests/
│   ├── users/
│   │   └── userService.test.ts
│   └── posts/
├── docs/
│   ├── database-tutorial.md
│   └── architecture.md
├── scripts/
│   └── seed.ts
├── schema.sql
├── package.json
└── tsconfig.json
```

### 9.3 実際のリファクタリング例

#### Before: users-api.ts（1ファイル、230行）

```typescript
// src/users-api.ts
import { Hono } from 'hono'

// 型定義
interface User { }
interface CreateUserInput { }
interface SuccessResponse<T> { }
interface ErrorResponse { }
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// データ
let users: User[] = [ ]
let nextId = 4

// アプリ
const app = new Hono()

// 全ユーザー取得
app.get('/users', (c) => { })

// ID検索
app.get('/users/:id', (c) => { })

// 新規作成
app.post('/users', async (c) => { })

// 更新
app.put('/users/:id', async (c) => { })

// 削除
app.delete('/users/:id', (c) => { })

export default app
```

#### After: 機能ごとに分割

**src/features/users/types.ts**
```typescript
// 型定義のみ
export interface User {
  id: number
  name: string
  email: string
  age: number
  createdAt: string
}

export interface CreateUserInput {
  name: string
  email: string
  age: number
}

export interface UpdateUserInput {
  name?: string
  email?: string
  age?: number
}
```

**src/features/users/repository.ts**
```typescript
// データアクセス層
import type { User, CreateUserInput, UpdateUserInput } from './types'

// データストア（本来はD1データベース）
let users: User[] = [
  { id: 1, name: '山田太郎', email: 'taro@example.com', age: 25, createdAt: '2026-01-15T10:00:00Z' },
  { id: 2, name: '佐藤花子', email: 'hanako@example.com', age: 22, createdAt: '2026-02-20T14:30:00Z' },
  { id: 3, name: '鈴木次郎', email: 'jiro@example.com', age: 28, createdAt: '2026-03-10T09:15:00Z' }
]
let nextId = 4

export const UserRepository = {
  // 全件取得
  findAll(): User[] {
    return users
  },

  // ID検索
  findById(id: number): User | undefined {
    return users.find(u => u.id === id)
  },

  // メールアドレス検索
  findByEmail(email: string): User | undefined {
    return users.find(u => u.email === email)
  },

  // 新規作成
  create(data: CreateUserInput): User {
    const newUser: User = {
      id: nextId++,
      ...data,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    return newUser
  },

  // 更新
  update(id: number, data: UpdateUserInput): User | null {
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return null

    users[index] = { ...users[index], ...data }
    return users[index]
  },

  // 削除
  delete(id: number): boolean {
    const index = users.findIndex(u => u.id === id)
    if (index === -1) return false

    users.splice(index, 1)
    return true
  },

  // 検索
  search(filters: {
    name?: string
    ageMin?: number
    ageMax?: number
  }): User[] {
    let result = users

    if (filters.name) {
      result = result.filter(u => u.name.includes(filters.name!))
    }
    if (filters.ageMin !== undefined) {
      result = result.filter(u => u.age >= filters.ageMin!)
    }
    if (filters.ageMax !== undefined) {
      result = result.filter(u => u.age <= filters.ageMax!)
    }

    return result
  }
}
```

**src/features/users/validation.ts**
```typescript
// バリデーション
import type { CreateUserInput, UpdateUserInput } from './types'

export function validateCreateUser(data: CreateUserInput): string[] {
  const errors: string[] = []

  if (!data.name || data.name.trim() === '') {
    errors.push('名前は必須です')
  }
  if (data.name && data.name.length > 50) {
    errors.push('名前は50文字以内で入力してください')
  }

  if (!data.email || data.email.trim() === '') {
    errors.push('メールアドレスは必須です')
  }
  if (data.email && !isValidEmail(data.email)) {
    errors.push('メールアドレスの形式が正しくありません')
  }

  if (data.age === undefined || data.age === null) {
    errors.push('年齢は必須です')
  }
  if (data.age < 0 || data.age > 150) {
    errors.push('年齢は0〜150の範囲で入力してください')
  }

  return errors
}

export function validateUpdateUser(data: UpdateUserInput): string[] {
  const errors: string[] = []

  if (data.name !== undefined) {
    if (data.name.trim() === '') {
      errors.push('名前は空にできません')
    }
    if (data.name.length > 50) {
      errors.push('名前は50文字以内で入力してください')
    }
  }

  if (data.email !== undefined) {
    if (data.email.trim() === '') {
      errors.push('メールアドレスは空にできません')
    }
    if (!isValidEmail(data.email)) {
      errors.push('メールアドレスの形式が正しくありません')
    }
  }

  if (data.age !== undefined) {
    if (data.age < 0 || data.age > 150) {
      errors.push('年齢は0〜150の範囲で入力してください')
    }
  }

  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

**src/features/users/service.ts**
```typescript
// ビジネスロジック
import { UserRepository } from './repository'
import { validateCreateUser, validateUpdateUser } from './validation'
import type { User, CreateUserInput, UpdateUserInput } from './types'

export const UserService = {
  // 全ユーザー取得
  getAllUsers(): User[] {
    return UserRepository.findAll()
  },

  // ID検索
  getUserById(id: number): User | null {
    const user = UserRepository.findById(id)
    return user || null
  },

  // 新規作成
  createUser(data: CreateUserInput): { user?: User; errors?: string[] } {
    // バリデーション
    const errors = validateCreateUser(data)
    if (errors.length > 0) {
      return { errors }
    }

    // メールアドレスの重複チェック
    const existingUser = UserRepository.findByEmail(data.email)
    if (existingUser) {
      return { errors: ['このメールアドレスは既に登録されています'] }
    }

    // ユーザー作成
    const user = UserRepository.create(data)
    return { user }
  },

  // 更新
  updateUser(id: number, data: UpdateUserInput): { user?: User; errors?: string[] } {
    // 存在確認
    const existingUser = UserRepository.findById(id)
    if (!existingUser) {
      return { errors: ['ユーザーが見つかりません'] }
    }

    // バリデーション
    const errors = validateUpdateUser(data)
    if (errors.length > 0) {
      return { errors }
    }

    // メールアドレスの重複チェック（自分以外）
    if (data.email) {
      const duplicateUser = UserRepository.findByEmail(data.email)
      if (duplicateUser && duplicateUser.id !== id) {
        return { errors: ['このメールアドレスは既に使用されています'] }
      }
    }

    // 更新
    const user = UserRepository.update(id, data)
    return { user: user! }
  },

  // 削除
  deleteUser(id: number): boolean {
    return UserRepository.delete(id)
  },

  // 検索
  searchUsers(filters: {
    name?: string
    ageMin?: number
    ageMax?: number
  }): User[] {
    return UserRepository.search(filters)
  }
}
```

**src/features/users/controller.ts**
```typescript
// リクエスト処理
import type { Context } from 'hono'
import { UserService } from './service'
import type { CreateUserInput, UpdateUserInput } from './types'
import type { ApiResponse } from '@/shared/types'

export const UserController = {
  // 全ユーザー取得
  async getAll(c: Context) {
    const users = UserService.getAllUsers()
    const response: ApiResponse<typeof users> = {
      success: true,
      data: users
    }
    return c.json(response)
  },

  // ID検索
  async getById(c: Context) {
    const id = Number(c.req.param('id'))
    const user = UserService.getUserById(id)

    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません'
        }
      }, 404)
    }

    return c.json({
      success: true,
      data: user
    })
  },

  // 新規作成
  async create(c: Context) {
    const body = await c.req.json<CreateUserInput>()
    const result = UserService.createUser(body)

    if (result.errors) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.errors.join(', ')
        }
      }, 400)
    }

    return c.json({
      success: true,
      data: result.user
    }, 201)
  },

  // 更新
  async update(c: Context) {
    const id = Number(c.req.param('id'))
    const body = await c.req.json<UpdateUserInput>()
    const result = UserService.updateUser(id, body)

    if (result.errors) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.errors.join(', ')
        }
      }, 400)
    }

    return c.json({
      success: true,
      data: result.user
    })
  },

  // 削除
  async delete(c: Context) {
    const id = Number(c.req.param('id'))
    const success = UserService.deleteUser(id)

    if (!success) {
      return c.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません'
        }
      }, 404)
    }

    return c.json({
      success: true,
      data: {
        message: `ID ${id} のユーザーを削除しました`
      }
    })
  },

  // 検索
  async search(c: Context) {
    const name = c.req.query('name')
    const ageMin = c.req.query('ageMin')
    const ageMax = c.req.query('ageMax')

    const users = UserService.searchUsers({
      name,
      ageMin: ageMin ? Number(ageMin) : undefined,
      ageMax: ageMax ? Number(ageMax) : undefined
    })

    return c.json({
      success: true,
      data: users
    })
  }
}
```

**src/features/users/routes.ts**
```typescript
// ルート定義
import { Hono } from 'hono'
import { UserController } from './controller'

const users = new Hono()

users.get('/', UserController.getAll)
users.get('/search', UserController.search)
users.get('/:id', UserController.getById)
users.post('/', UserController.create)
users.put('/:id', UserController.update)
users.delete('/:id', UserController.delete)

export default users
```

**src/features/users/index.ts**
```typescript
// 再エクスポート
export { default as usersRoutes } from './routes'
export * from './types'
export { UserService } from './service'
```

**src/shared/types/ApiResponse.ts**
```typescript
// 共通型定義
export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
```

**src/index.ts（更新）**
```typescript
// エントリーポイント
import { Hono } from 'hono'
import { usersRoutes } from './features/users'

const app = new Hono()

// APIルート
app.route('/api/v1/users', usersRoutes)

// ルートエンドポイント
app.get('/', (c) => c.text('Hello Hono!'))

export default app
```

### 9.4 リファクタリングのメリット

**Before（1ファイル230行）と After（複数ファイルに分割）の比較：**

| 項目 | Before | After |
|------|--------|-------|
| **ファイル数** | 1ファイル | 7ファイル |
| **行数** | 230行 | 各50〜80行 |
| **責務** | すべて混在 | 明確に分離 |
| **テストのしやすさ** | 難しい | 容易 |
| **再利用性** | 低い | 高い |
| **保守性** | 低い | 高い |
| **拡張性** | 難しい | 容易 |

**具体的なメリット：**

1. **テストが書きやすい**
   ```typescript
   // validation.test.ts
   import { validateCreateUser } from './validation'

   test('名前が空の場合、エラーが返る', () => {
     const errors = validateCreateUser({ name: '', email: 'test@example.com', age: 25 })
     expect(errors).toContain('名前は必須です')
   })
   ```

2. **ビジネスロジックの再利用**
   ```typescript
   // 別のAPIでも UserService を使える
   import { UserService } from '@/features/users'

   const user = UserService.getUserById(123)
   ```

3. **変更の影響範囲が明確**
   - バリデーションの変更 → `validation.ts` だけ
   - データアクセスの変更 → `repository.ts` だけ
   - APIの変更 → `controller.ts` と `routes.ts` だけ

4. **チーム開発がしやすい**
   - メンバーA：`validation.ts` を修正
   - メンバーB：`service.ts` を修正
   - コンフリクトが起きにくい

---

## 10. コードレビューのポイント

### 10.1 コードレビューとは？

**コードレビュー（Code Review）**とは：
- 他の開発者が書いたコードを確認する作業
- バグの早期発見
- コード品質の向上
- 知識の共有

### 10.2 レビューでチェックすべき項目

#### 機能性
- [ ] 要件を満たしているか
- [ ] バグはないか
- [ ] エッジケース（境界値）を考慮しているか

#### 可読性
- [ ] 変数名・関数名は適切か
- [ ] コメントは適切か（多すぎない、少なすぎない）
- [ ] ロジックは理解しやすいか

#### 保守性
- [ ] 重複コードはないか（DRY原則）
- [ ] 1つの関数は1つのことだけを行っているか（SRP）
- [ ] テストは書かれているか

#### パフォーマンス
- [ ] 明らかな非効率はないか
- [ ] N+1問題は発生していないか
- [ ] 不要な処理はないか

#### セキュリティ
- [ ] SQLインジェクション対策はされているか
- [ ] XSS対策はされているか
- [ ] 機密情報がハードコードされていないか

### 10.3 良いレビューコメントの書き方

```typescript
// ❌ 悪いコメント
// 「これは間違っています」
// 「良くないです」
// 「直してください」

// ✅ 良いコメント
// 「SQLインジェクションの脆弱性があるため、bind()を使用してください」
// 「この関数は80行あり長すぎます。小さな関数に分割することを提案します」
// 「validateEmail()の処理が重複しています。shared/utils/validation.tsに共通化しましょう」
```

**ポイント：**
- **具体的に**指摘する
- **理由を**説明する
- **代替案を**提示する
- **敬意を**持って伝える

---

## まとめ

### リーダブルコードの基本

1. **明確な命名** - 変数名・関数名で意図を伝える
2. **単一責任** - 1つの関数は1つのことだけを行う
3. **DRY原則** - 重複コードを避ける
4. **早期リターン** - ネストを減らす
5. **適切なコメント** - 「なぜ」を説明する

### プロジェクト構成の基本

1. **機能ごとに分割** - Feature-based アーキテクチャ
2. **層の分離** - Controller, Service, Repository
3. **共通化** - shared フォルダで再利用
4. **一貫性** - 命名規則を統一
5. **スケーラビリティ** - 機能追加に強い構造

### 継続的改善

- コードレビューを活用
- リファクタリングを恐れない
- テストを書く習慣をつける
- 大企業のベストプラクティスを学ぶ
- チーム内で議論して改善する

---

**このガイドで学んだことを、日々の開発に活かしてください！** 🚀

最初から完璧なコードを書く必要はありません。少しずつ改善していくことが大切です。
