# StudyNextjs

Next.js (App Router) + TypeScript + Tailwind CSS で作成した Todo アプリです。  
**トップページ (`/`) は MDX で実装**しており、Markdown と React コンポーネントを組み合わせたページ構築を確認できます。

## 主な画面

- `/` : MDX で作成したアプリ全体の解説ページ
- `/todos` : Todo 一覧
- `/todos/create` : Todo 作成
- `/todos/[todo_id]` : Todo 詳細
- `/todos/[todo_id]/update` : Todo 更新
- `/todos/[todo_id]/delete` : Todo 削除完了

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## MDX の実装ポイント

このプロジェクトでは以下の構成で MDX を有効化しています。

1. `next.config.ts` で `@next/mdx` を設定
2. `pageExtensions` に `md` / `mdx` を追加
3. ルート直下の `mdx-components.tsx` で見出し・本文・コードブロック等の共通スタイルを定義
4. `remark-gfm` でテーブルなどの GFM 記法を有効化
5. `app/page.mdx` で Markdown + React コンポーネントを併用

### 使用している主な MDX 関連パッケージ

- `@next/mdx`
- `@mdx-js/loader`
- `@mdx-js/react`
- `remark-gfm`

## styled-components の実装ポイント

1. `next.config.ts` の `compiler.styledComponents` を有効化
2. `app/StyledComponentsRegistry.tsx` で SSR 用のスタイル挿入を設定
3. `app/layout.tsx` で `StyledComponentsRegistry` を適用
4. `shared/components/mdx/StyledNote.tsx` を `app/page.mdx` から読み込んで利用

## 開発コマンド

```bash
npm run lint
npm run build
```
