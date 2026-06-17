/**
 * ユーザー管理API - Cloudflare Workers D1版
 *
 * このファイルは、メモリ内配列を使っていた users-api.ts を
 * Cloudflare Workers D1データベースを使うように書き換えた参考実装です。
 *
 * 【注意】このファイルは参考用のコード例です。実際に動作させるには：
 * 1. wrangler.jsonc に D1設定を追加
 * 2. schema.sql を適用
 * 3. このファイルを src/users-api.ts としてコピー（または内容を置き換え）
 */

import { Hono } from 'hono';

// ========== 型定義 ==========

/**
 * Cloudflare Workers の Bindings 型定義
 *
 * Bindingsとは：
 * Cloudflare Workers で使える外部リソース（データベース、KVなど）を
 * TypeScriptのコード内で型安全に扱うための定義です。
 *
 * wrangler.jsonc の "binding": "DB" と対応しています。
 */
type Bindings = {
  DB: D1Database; // D1Databaseは Cloudflare Workers の組み込み型
};

/**
 * ユーザーの型定義
 *
 * データベースのusersテーブルの構造と対応しています。
 */
interface User {
  id: number; // PRIMARY KEY AUTOINCREMENT
  name: string; // TEXT NOT NULL
  email: string; // TEXT NOT NULL UNIQUE
  age: number; // INTEGER NOT NULL
  createdAt: string; // TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
}

/**
 * 新規ユーザー作成時の入力データ型
 *
 * idとcreatedAtは自動生成されるため、不要です。
 */
interface CreateUserInput {
  name: string;
  email: string;
  age: number;
}

/**
 * ユーザー更新時の入力データ型
 *
 * すべてのフィールドが省略可能（部分更新）
 */
interface UpdateUserInput {
  name?: string;
  email?: string;
  age?: number;
}

// ========== レスポンス型定義 ==========

/**
 * 成功時のAPIレスポンス型
 *
 * ジェネリクス <T> を使って、さまざまなデータ型に対応
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * エラー時のAPIレスポンス型
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string; // エラーコード（例: USER_NOT_FOUND）
    message: string; // ユーザーに表示するメッセージ
  };
}

/**
 * APIレスポンスの型（成功またはエラー）
 *
 * ユニオン型（|）を使って、どちらかの型を表現
 */
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ========== Honoアプリの作成 ==========

/**
 * Hono アプリケーションのインスタンス作成
 *
 * <{ Bindings: Bindings }> でジェネリクスを指定することで、
 * c.env.DB が型安全にアクセスできるようになります。
 */
const app = new Hono<{
  Bindings: Bindings;
}>();

// ========== API エンドポイント ==========

/**
 * エンドポイント 1: 全ユーザーを取得
 * GET /users
 *
 * 【配列版との違い】
 * 配列版: return c.json({ success: true, data: users })
 * D1版:   データベースから SELECT で取得
 */
app.get('/users', async (c) => {
  try {
    // ① SQL クエリの準備
    // prepare() メソッドで SQLクエリを準備します
    const stmt = c.env.DB.prepare('SELECT * FROM users');

    // ② クエリの実行
    // all() メソッドで全件取得します
    // await: 非同期処理の完了を待つ
    const result = await stmt.all();

    // ③ 結果の構造
    // result.results: 取得したデータの配列
    // result.success: クエリが成功したかの真偽値
    // result.meta: メタ情報（実際期数、実行時間など）

    // ④ レスポンスの作成
    const response: ApiResponse<User[]> = {
      success: true,
      data: result.results as User[], // 型アサーション
    };

    return c.json(response);
  } catch (error) {
    // データベースエラーのハンドリング
    console.error('Database error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'ユーザー一覧の取得に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * エンドポイント 2: 検索機能（名前・年齢で絞り込み）
 * GET /users/search?name=太郎&ageMin=20&ageMax=30
 *
 * ⚠️ 重要：/users/:id よりも前に配置する必要があります
 *
 * 【配列版との違い】
 * 配列版: users.filter(u => u.name.includes(name))
 * D1版:   WHERE句とLIKE演算子を使用
 */
app.get('/users/search', async (c) => {
  try {
    // クエリパラメータを取得
    const name = c.req.query('name');
    const ageMin = c.req.query('ageMin');
    const ageMax = c.req.query('ageMax');

    // ① 動的にSQLクエリを構築
    // 条件が指定されているものだけをWHERE句に追加します
    let sql = 'SELECT * FROM users WHERE 1=1'; // 1=1 は常に真（条件追加を簡単にするトリック）
    const params: any[] = []; // プレースホルダーにバインドする値の配列

    // 名前での絞り込み（部分一致）
    if (name) {
      sql += ' AND name LIKE ?';
      params.push(`%${name}%`); // %は任意の文字列を表すワイルドカード
    }

    // 年齢の下限での絞り込み
    if (ageMin) {
      sql += ' AND age >= ?';
      params.push(Number(ageMin));
    }

    // 年齢の上限での絞り込み
    if (ageMax) {
      sql += ' AND age <= ?';
      params.push(Number(ageMax));
    }

    // ② SQLクエリの準備とパラメータのバインド
    let stmt = c.env.DB.prepare(sql);

    // 複数のパラメータをバインド
    // params配列の順番と、SQLの ? の順番が対応します
    if (params.length > 0) {
      stmt = stmt.bind(...params); // スプレッド演算子で配列を展開
    }

    // ③ クエリの実行
    const result = await stmt.all();

    const response: ApiResponse<User[]> = {
      success: true,
      data: result.results as User[],
    };

    return c.json(response);
  } catch (error) {
    console.error('Search error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'ユーザー検索に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * エンドポイント 3: 特定のユーザーをIDで取得
 * GET /users/:id
 *
 * 【配列版との違い】
 * 配列版: users.find(u => u.id === id)
 * D1版:   WHERE id = ? で検索
 */
app.get('/users/:id', async (c) => {
  try {
    // URLパラメータからIDを取得
    const id = Number(c.req.param('id'));

    // ① SQL クエリの準備
    // WHERE句で特定のIDのユーザーを検索
    const stmt = c.env.DB.prepare('SELECT * FROM users WHERE id = ?');

    // ② パラメータのバインド
    // ? プレースホルダーに id の値をバインド
    // これにより SQLインジェクション攻撃を防ぎます
    const boundStmt = stmt.bind(id);

    // ③ クエリの実行（1件取得）
    // first() メソッドは、最初の1件だけを取得します
    // 見つからない場合は null を返します
    const user = await boundStmt.first();

    // ④ ユーザーが見つからない場合のエラー処理
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`,
        },
      };
      return c.json(errorResponse, 404);
    }

    // ⑤ 成功レスポンス
    const response: ApiResponse<User> = {
      success: true,
      data: user as User,
    };

    return c.json(response);
  } catch (error) {
    console.error('Get user error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'ユーザーの取得に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * エンドポイント 4: 新規ユーザーを作成
 * POST /users
 * Body: { "name": "田中太郎", "email": "tanaka@example.com", "age": 25 }
 *
 * 【配列版との違い】
 * 配列版: users.push(newUser)
 * D1版:   INSERT INTO で挿入
 */
app.post('/users', async (c) => {
  try {
    // ① リクエストボディからデータを取得
    // c.req.json() でJSONをパースします
    const body = await c.req.json<CreateUserInput>();

    // ② バリデーション（入力検証）
    // 必須項目がすべて入力されているかチェック
    if (!body.name || !body.email || !body.age) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, email, age は必須です',
        },
      };
      return c.json(errorResponse, 400);
    }

    // 年齢の範囲チェック
    if (body.age < 0 || body.age > 150) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_AGE',
          message: '年齢は0〜150の範囲で指定してください',
        },
      };
      return c.json(errorResponse, 400);
    }

    // ③ 現在時刻の取得（ISO 8601形式）
    const createdAt = new Date().toISOString();

    // ④ INSERT クエリの準備
    // VALUES (?, ?, ?, ?) の ? がプレースホルダー
    const stmt = c.env.DB.prepare(`
      INSERT INTO users (name, email, age, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    // ⑤ パラメータのバインド
    // bind() の引数の順番が ? の順番と対応します
    const boundStmt = stmt.bind(body.name, body.email, body.age, createdAt);

    // ⑥ クエリの実行
    // run() メソッドは INSERT, UPDATE, DELETE で使います
    const result = await boundStmt.run();

    // ⑦ 挿入されたユーザーのIDを取得
    // result.meta.last_row_id に新しく挿入された行のIDが入ります
    const userId = result.meta.last_row_id;

    // ⑧ 挿入したユーザーのデータを取得（確認用）
    const newUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();

    // ⑨ 成功レスポンス
    const response: ApiResponse<User> = {
      success: true,
      data: newUser as User,
    };

    return c.json(response, 201); // 201 Created
  } catch (error: any) {
    console.error('Create user error:', error);

    // UNIQUE制約違反のエラーを特別に処理
    // error.message に "UNIQUE constraint failed" が含まれる場合
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'このメールアドレスは既に登録されています',
        },
      };
      return c.json(errorResponse, 409); // 409 Conflict
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'ユーザーの作成に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * エンドポイント 5: ユーザー情報を更新
 * PUT /users/:id
 * Body: { "name": "新しい名前", "age": 26 } （更新したいフィールドのみ）
 *
 * 【配列版との違い】
 * 配列版: users[userIndex].name = body.name
 * D1版:   UPDATE SET で更新
 */
app.put('/users/:id', async (c) => {
  try {
    // ① URLパラメータからIDを取得
    const id = Number(c.req.param('id'));

    // ② ユーザーの存在確認
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`,
        },
      };
      return c.json(errorResponse, 404);
    }

    // ③ リクエストボディからデータを取得
    const body = await c.req.json<UpdateUserInput>();

    // ④ 動的にUPDATE文を構築
    // 指定されたフィールドだけを更新します（部分更新）
    const updates: string[] = []; // SET句の配列
    const params: any[] = []; // パラメータの配列

    if (body.name !== undefined) {
      updates.push('name = ?');
      params.push(body.name);
    }

    if (body.email !== undefined) {
      updates.push('email = ?');
      params.push(body.email);
    }

    if (body.age !== undefined) {
      // 年齢の範囲チェック
      if (body.age < 0 || body.age > 150) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'INVALID_AGE',
            message: '年齢は0〜150の範囲で指定してください',
          },
        };
        return c.json(errorResponse, 400);
      }
      updates.push('age = ?');
      params.push(body.age);
    }

    // 更新するフィールドがない場合
    if (updates.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: '更新するフィールドが指定されていません',
        },
      };
      return c.json(errorResponse, 400);
    }

    // ⑤ SQL文の構築
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id); // WHERE句のIDを最後に追加

    // ⑥ クエリの実行
    const stmt = c.env.DB.prepare(sql);
    await stmt.bind(...params).run();

    // ⑦ 更新後のユーザーデータを取得
    const updatedUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    )
      .bind(id)
      .first();

    // ⑧ 成功レスポンス
    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser as User,
    };

    return c.json(response);
  } catch (error: any) {
    console.error('Update user error:', error);

    // UNIQUE制約違反のエラーを処理
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'このメールアドレスは既に使用されています',
        },
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'ユーザーの更新に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * エンドポイント 6: ユーザーを削除
 * DELETE /users/:id
 *
 * 【配列版との違い】
 * 配列版: users.splice(userIndex, 1)
 * D1版:   DELETE FROM で削除
 */
app.delete('/users/:id', async (c) => {
  try {
    // ① URLパラメータからIDを取得
    const id = Number(c.req.param('id'));

    // ② ユーザーの存在確認
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existingUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: `ID ${id} のユーザーが見つかりません`,
        },
      };
      return c.json(errorResponse, 404);
    }

    // ③ DELETE クエリの実行
    const stmt = c.env.DB.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.bind(id).run();

    // ④ 削除された行数を確認
    // result.meta.rows_written に削除された行数が入ります
    const rowsDeleted = result.meta.rows_written || 0;

    if (rowsDeleted === 0) {
      // 削除されなかった場合（通常はあり得ない）
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'ユーザーの削除に失敗しました',
        },
      };
      return c.json(errorResponse, 500);
    }

    // ⑤ 成功レスポンス
    const response: ApiResponse<{
      message: string;
    }> = {
      success: true,
      data: {
        message: `ID ${id} のユーザーを削除しました`,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Delete user error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'ユーザーの削除に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

// ========== トランザクションの例（応用編） ==========

/**
 * エンドポイント 7: 複数のユーザーを一括作成（トランザクション使用）
 * POST /users/batch
 * Body: [
 *   { "name": "ユーザー1", "email": "user1@example.com", "age": 20 },
 *   { "name": "ユーザー2", "email": "user2@example.com", "age": 25 }
 * ]
 *
 * トランザクションとは：
 * 複数の操作をまとめて実行し、すべて成功するか、すべて失敗するかを保証する仕組みです。
 * 例: 2人のユーザーを登録する際、1人目は成功したが2人目は失敗した場合、
 *      1人目の登録もロールバック（取り消し）されます。
 */
app.post('/users/batch', async (c) => {
  try {
    // ① リクエストボディから配列を取得
    const users = await c.req.json<CreateUserInput[]>();

    // ② バリデーション
    if (!Array.isArray(users) || users.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'ユーザーの配列が必要です',
        },
      };
      return c.json(errorResponse, 400);
    }

    // ③ トランザクションの準備
    // batch() メソッドで複数のクエリをまとめて実行
    const statements = users.map((user) => {
      const createdAt = new Date().toISOString();
      return c.env.DB.prepare(
        `
        INSERT INTO users (name, email, age, createdAt)
        VALUES (?, ?, ?, ?)
      `
      ).bind(user.name, user.email, user.age, createdAt);
    });

    // ④ トランザクションの実行
    // すべてのINSERTが成功するか、すべて失敗します
    const results = await c.env.DB.batch(statements);

    // ⑤ 成功レスポンス
    const response: ApiResponse<{
      count: number;
    }> = {
      success: true,
      data: {
        count: results.length,
      },
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Batch create error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'BATCH_CREATE_ERROR',
        message: 'ユーザーの一括作成に失敗しました',
      },
    };
    return c.json(errorResponse, 500);
  }
});

// ========== エクスポート ==========

export default app;

// ========== 使い方のまとめ ==========
/**
 * このファイルを実際に使うには：
 *
 * 1. wrangler.jsonc に以下を追加：
 *    "d1_databases": [
 *      {
 *        "binding": "DB",
 *        "database_name": "my-user-database",
 *        "database_id": "取得したID"
 *      }
 *    ]
 *
 * 2. schema.sql を適用：
 *    wrangler d1 execute my-user-database --local --file=./schema.sql
 *
 * 3. src/index.ts でインポート：
 *    import usersApi from './examples/users-api-with-d1'
 *    app.route('/api/v1', usersApi)
 *
 * 4. 開発サーバー起動：
 *    npm run dev
 *
 * 5. テスト：
 *    curl http://localhost:8787/api/v1/users
 */

// ========== D1 API リファレンス ==========
/**
 * 主なメソッド：
 *
 * 1. prepare(sql)
 *    - SQLクエリを準備
 *    - 返り値: D1PreparedStatement
 *
 * 2. bind(...values)
 *    - プレースホルダー（?）に値をバインド
 *    - 返り値: D1PreparedStatement
 *
 * 3. all()
 *    - 全件取得
 *    - 返り値: { results: [], success: boolean, meta: {} }
 *
 * 4. first()
 *    - 1件取得（最初の行）
 *    - 返り値: object | null
 *
 * 5. run()
 *    - INSERT/UPDATE/DELETE の実行
 *    - 返り値: { success: boolean, meta: { last_row_id, rows_written } }
 *
 * 6. batch(statements[])
 *    - トランザクション（複数クエリを一括実行）
 *    - すべて成功 or すべて失敗
 *    - 返り値: results配列
 *
 * 7. dump()
 *    - データベース全体を SQL としてダンプ
 *    - バックアップに使用
 *
 * 8. exec(sql)
 *    - 複数のSQL文を一度に実行
 *    - スキーマ定義などに使用
 */
