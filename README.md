# Untitled Sekai

## プロジェクト概要
Untitled SekaiはSonolusでのプロセカ創作譜面投稿プラットフォームです。
このREADMEでは簡単な使い方、プロジェクトの概要、セットアップ、構成について説明します。

### 環境構築
必要条件

- Node.js (バージョン20.16.0推奨)
- Rust
- Docker

### 起動手順
```bash
git clone https://github.com/Piliman22/untitledsekai
cd untitledsekai

docker compose build

docker compose up -d
```

## プロジェクト構成
```bash
untitledsekai/
├── client/           # フロントエンドコード
├── src/              # バックエンドコード
├── static/           # 静的ファイル
└── source            # Sonolusのためのスキン等のデータ
```

### フロントエンド構成

clientディレクトリには、フロントエンドのコードが格納されています。詳細についてはフロントエンドのREADMEを参照してください。

## 主な機能
- Webサイトからの譜面の投稿
- DiscordBotとの連携
- Sonolusに対応させたAPI

## 技術スタック
- フロントエンド：Typescript + React
- バックエンド：Typescript + expressjs(Sonolus-Expressを主に使っています) + Rust(画像処理)
- データベース：MongoDB

## ライセンス
GPL-3.0 licenseを元に公開しています。