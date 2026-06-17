/**
 * TypeScript基礎チュートリアル
 * 型定義とインターフェースの使い方を学ぶ
 */

// ========== 1. 基本的な型 ==========

// プリミティブ型（基本的なデータ型）
const name: string = '太郎'; // 文字列型
const age: number = 25; // 数値型
const isStudent: boolean = true; // 真偽値型（trueかfalse）
const nothing: null = null; // null型
const notDefined: undefined = undefined; // undefined型

// 配列の型
const numbers: number[] = [1, 2, 3, 4, 5];
const names: string[] = ['太郎', '花子', '次郎'];

// オブジェクトの型（インラインで定義）
const user: {
  name: string;
  age: number;
} = {
  name: '太郎',
  age: 25,
};

// ========== 2. インターフェース（Interface） ==========
// オブジェクトの「形」を定義する方法
// 再利用できるので便利！

interface User {
  id: number; // 必須のプロパティ
  name: string;
  email: string;
  age?: number; // ?マークで省略可能なプロパティ
  isActive: boolean;
}

// インターフェースを使った変数
const user1: User = {
  id: 1,
  name: '太郎',
  email: 'taro@example.com',
  isActive: true,
  // age は省略可能なので書かなくてもOK
};

const user2: User = {
  id: 2,
  name: '花子',
  email: 'hanako@example.com',
  age: 22,
  isActive: true,
};

// ========== 3. タイプエイリアス（Type Alias） ==========
// インターフェースに似ているが、より柔軟

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type Status = 'pending' | 'active' | 'completed' | 'cancelled';
// ↑ これは「ユニオン型」という
// 4つの文字列のうちどれか1つしか入れられない

const taskStatus: Status = 'pending'; // OK
// const taskStatus2: Status = 'unknown'  // エラー！定義されていない値

// ========== 4. 関数の型定義 ==========

// 引数と戻り値に型を指定
function add(a: number, b: number): number {
  return a + b;
}

// アロー関数でも同じ
const subtract = (a: number, b: number): number => {
  return a - b;
};

// オブジェクトを返す関数
function createUser(name: string, age: number): User {
  return {
    id: Math.floor(Math.random() * 10000),
    name: name,
    email: `${name}@example.com`,
    age: age,
    isActive: true,
  };
}

// ========== 5. 配列とジェネリクス ==========

// ユーザーの配列
const users: User[] = [
  {
    id: 1,
    name: '太郎',
    email: 'taro@example.com',
    isActive: true,
  },
  {
    id: 2,
    name: '花子',
    email: 'hanako@example.com',
    age: 22,
    isActive: true,
  },
];

// 配列を処理する関数
function getUserNames(users: User[]): string[] {
  return users.map((user) => user.name);
}

// ========== 6. APIレスポンスの型定義（実践的な例） ==========

// 成功時のレスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// エラー時のレスポンス
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// どちらかのレスポンスを返す型
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// 使用例
const successResponse: ApiResponse<User> = {
  success: true,
  data: user1,
};

const errorResponse: ApiResponse<User> = {
  success: false,
  error: {
    code: 'USER_NOT_FOUND',
    message: 'ユーザーが見つかりません',
  },
};

// ========== 7. 実践例：ブログ記事の型定義 ==========

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  published: boolean;
  viewCount: number;
}

// ブログ記事を作成する関数
function createBlogPost(
  title: string,
  content: string,
  author: User,
  tags: string[]
): BlogPost {
  const now = new Date();
  return {
    id: Math.floor(Math.random() * 10000),
    title: title,
    content: content,
    author: author,
    createdAt: now,
    updatedAt: now,
    tags: tags,
    published: false,
    viewCount: 0,
  };
}

// エクスポート（他のファイルから使えるようにする）
export type { User, Product, Status, ApiResponse, BlogPost };
