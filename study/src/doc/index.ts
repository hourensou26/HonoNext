// 1. Honoをインポート（読み込み）する
import { Hono } from 'hono';

// ユーザー管理APIをインポート
import usersApi from './users-api';

// 2. Honoアプリケーションのインスタンス（実体）を作成
const app = new Hono();

// ========== ユーザー管理API をマウント ==========
// /api/v1 配下にユーザー管理APIを配置
// 例: /api/v1/users にアクセスできる
app.route('/api/v1', usersApi);

// 3. ルート（/）にアクセスしたときの処理
//    GETメソッド = データを取得する操作
app.get('/', (c) => {
  return c.text('Hello Hono!'); // テキストを返す
});

// 4. /api/helloにアクセスしたときの処理
app.get('api/hello', (c) => {
  return c.json({
    // JSON形式でデータを返す
    ok: true,
    message: 'Hello Hono API!',
  });
});

// 5. 投稿を作成する処理（POSTメソッド）
//    POSTメソッド = データを新規作成する操作
app.post('/posts', (c) => c.text('Created!', 201));

// 6. 投稿を削除する処理（DELETEメソッド）
//    :id = 動的なパラメータ（変数のように使える）
app.delete('/posts/:id', (c) => c.text(`${c.req.param('id')} is deleted!`));

// 7. 投稿の詳細を取得する処理
app.get('/posts/:id', (c) => {
  const page = c.req.query('page'); // クエリパラメータを取得
  const id = c.req.param('id'); // URLパラメータを取得
  c.header('X-Message', 'Hi!'); // レスポンスヘッダーを設定
  return c.text(`You want see ${page} of ${id}`);
});

// ====== 演習：新しいルートを追加 ======

// 演習1: 自己紹介API
// このエンドポイントにアクセスすると、プロフィール情報をJSON形式で返します
app.get('/api/profile', (c) => {
  return c.json({
    name: '初学者',
    hobby: 'プログラミング学習',
    learning: ['TypeScript', 'Hono'],
    message: 'Honoの勉強を頑張っています！',
  });
});

// 演習2: 計算機能（足し算）
// クエリパラメータで2つの数値を受け取り、足し算の結果を返します
// 使い方: /api/calc?a=5&b=3
app.get('/api/calc', (c) => {
  // クエリパラメータから数値を取得
  const a = Number(c.req.query('a')); // 文字列を数値に変換
  const b = Number(c.req.query('b'));

  // 計算結果をJSON形式で返す
  return c.json({
    a: a,
    b: b,
    result: a + b,
    operation: '足し算',
  });
});

// 演習3: 挨拶API（名前をパラメータで受け取る）
// 使い方: /api/greet/太郎
app.get('/api/greet/:name', (c) => {
  const name = c.req.param('name');
  return c.json({
    message: `こんにちは、${name}さん！`,
    timestamp: new Date().toISOString(), // 現在の日時を追加
  });
});

//問題
//引き算
app.get('/api/subtract', (c) => {
  const a = Number(c.req.query('a'));
  const b = Number(c.req.query('b'));
  return c.json({
    a: a,
    b: b,
    result: a - b,
    operation: '引き算',
  });
});

//おみくじ
app.get('/api/omikuji', (c) => {
  const fortunes = ['大吉', '中吉', '小吉', '吉', '末吉', '凶'];
  const randomIndex = Math.floor(Math.random() * fortunes.length);
  return c.json({
    fortune: fortunes[randomIndex],
    timestamp: new Date().toISOString(),
  });
});

//年齢計算
app.get('/api/age', (c) => {
  const birthYear = Number(c.req.query('birthYear'));
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return c.json({
    age: age,
    timestamp: new Date().toISOString(),
  });
});

// 8. アプリをエクスポート（外部から使えるようにする）
export default app;
