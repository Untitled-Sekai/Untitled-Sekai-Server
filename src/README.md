# Untitled Sekai バックエンド
## 概要
Untitled Sekaiのバックエンドは、譜面のアップロード、管理、配信、などの多数の機能を提供しています。

## 技術スタック
- 主な言語： Typescript
- フレームワーク： Expressjs(@sonolus/expressをメインに)
- データベース： MongoDB
- 画像処理： Rust
- 音声処理： FFmpeg
- 認証： JWT

## フォルダ構造
```bash
src/
├── api/               # API関連のエンドポイント
│   ├── anonymous.ts   # 副名義関連API
│   ├── chart.ts       # 譜面管理API
│   ├── middleware/    # ミドルウェア
│   └── ...
├── auth/              # 認証関連
├── db/                # データベース接続
├── discord/           # Discordボット連携
├── models/            # データモデル
├── sonolus/           # Sonolus関連のエンドポイント等
│   ├── install.ts
│   ├── level/         # 譜面関連処理
│   └── ...
├── index.ts           # エントリーポイント
└── ...
```

## 主な機能
### 譜面管理
- 譜面のアップロード、編集、削除
- 譜面のデータ変換
- カバー画像の処理、プレビュー生成

### ユーザー管理
- ユーザー登録、認証
- 副名義の登録
- フォロー機能

### Sonolus
- Sonolusクライアント向けのAPIの提供

### その他
- DiscordBotとの連携
- イベント管理
- ストレージ管理

## セットアップ
### 必要条件
- Node.js(v20.16.0推奨)
- MongoDB
- FFmpeg(プレビュー作成)
- Rust(画像処理)

### 環境変数
```bash
PORT=
SECRET_KEY=""
MONGODB_URI=
SUB_IMAGE_URL=

DISCORD_TOKEN=""
API_KEY=
```

## API概要
主なエンドポイントは以下の通りです

### 認証
- `POST /api/register` - ユーザー登録
- `POST /api/login` - ログイン

### 譜面関連
- `POST /api/chart/upload` - 譜面アップロード
- `PATCH /api/chart/edit/:id` - 譜面編集
- `DELETE /api/chart/delete/:id` - 譜面削除
- `GET /api/charts` - 譜面一覧の取得