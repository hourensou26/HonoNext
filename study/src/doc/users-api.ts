/**
 * ユーザー管理API
 * TypeScriptの型定義を使った実践的な例
 */

import { Hono } from 'hono';

// ========== 型定義 ==========

// ユーザーの型定義
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: string;
}

// 新規ユーザー作成時のデータ型（IDは自動生成されるので不要）
interface CreateUserInput {
  name: string;
  email: string;
  age: number;
}

// APIレスポンスの型
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ========== データベース代わりの配列 ==========
// 本来はデータベースを使うが、学習のため配列で代用

const users: User[] = [
  {
    id: 1,
    name: '山田太郎',
    email: 'taro@example.com',
    age: 25,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: '佐藤花子',
    email: 'hanako@example.com',
    age: 22,
    createdAt: '2026-02-20T14:30:00Z',
  },
  {
    id: 3,
    name: '鈴木次郎',
    email: 'jiro@example.com',
    age: 28,
    createdAt: '2026-03-10T09:15:00Z',
  },
];

// 次のIDを生成（自動インクリメント）
let nextId = 4;

// ========== Honoアプリの作成 ==========

const app = new Hono();

// ========== API エンドポイント ==========

// 1. 全ユーザーを取得
// GET /users
app.get('/users', (c) => {
  const response: ApiResponse<User[]> = {
    success: true,
    data: users,
  };
  return c.json(response);
});

// 2. 検索機能（クエリパラメータで検索）
// ⚠️ 重要：この検索エンドポイントは /users/:id よりも前に配置する必要がある
// GET /users/search?name=太郎
app.get('/users/search', (c) => {
  const name = c.req.query('name');
  const ageMin = c.req.query('ageMin');
  const ageMax = c.req.query('ageMax');

  let filteredUsers = users;

  // 名前で検索（部分一致）
  if (name) {
    filteredUsers = filteredUsers.filter((u) => u.name.includes(name));
  }

  // 年齢での絞り込み
  if (ageMin) {
    filteredUsers = filteredUsers.filter((u) => u.age >= Number(ageMin));
  }
  if (ageMax) {
    filteredUsers = filteredUsers.filter((u) => u.age <= Number(ageMax));
  }

  const response: ApiResponse<User[]> = {
    success: true,
    data: filteredUsers,
  };
  return c.json(response);
});

// 3. 特定のユーザーをIDで取得
// GET /users/:id
app.get('/users/:id', (c) => {
  const id = Number(c.req.param('id'));
  const user = users.find((u) => u.id === id);

  if (!user) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`,
      },
    };
    return c.json(errorResponse, 404); // 404 = Not Found
  }

  const response: ApiResponse<User> = {
    success: true,
    data: user,
  };
  return c.json(response);
});

// 3. 新規ユーザーを作成
// POST /users
app.post('/users', async (c) => {
  try {
    // リクエストボディからデータを取得
    const body = await c.req.json<CreateUserInput>();

    // バリデーション（検証）
    if (!body.name || !body.email || !body.age) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, email, age は必須です',
        },
      };
      return c.json(errorResponse, 400); // 400 = Bad Request
    }

    // 新しいユーザーを作成
    const newUser: User = {
      id: nextId++,
      name: body.name,
      email: body.email,
      age: body.age,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    const response: ApiResponse<User> = {
      success: true,
      data: newUser,
    };
    return c.json(response, 201); // 201 = Created
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ユーザーの作成に失敗しました',
      },
    };
    return c.json(errorResponse, 500); // 500 = Internal Server Error
  }
});

// 4. ユーザー情報を更新
// PUT /users/:id
app.put('/users/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`,
      },
    };
    return c.json(errorResponse, 404);
  }

  try {
    const body = await c.req.json<Partial<CreateUserInput>>();

    // 既存のデータを更新（指定されたフィールドのみ）
    if (body.name) users[userIndex].name = body.name;
    if (body.email) users[userIndex].email = body.email;
    if (body.age) users[userIndex].age = body.age;

    const response: ApiResponse<User> = {
      success: true,
      data: users[userIndex],
    };
    return c.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ユーザーの更新に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

// 5. ユーザーを削除
// DELETE /users/:id
app.delete('/users/:id', (c) => {
  const id = Number(c.req.param('id'));
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `ID ${id} のユーザーが見つかりません`,
      },
    };
    return c.json(errorResponse, 404);
  }

  // 配列から削除
  users.splice(userIndex, 1);

  const response: ApiResponse<{
    message: string;
  }> = {
    success: true,
    data: {
      message: `ID ${id} のユーザーを削除しました`,
    },
  };
  return c.json(response);
});

export default app;
