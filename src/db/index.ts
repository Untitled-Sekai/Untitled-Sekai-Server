// DBに接続するための関数
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);
dotenv.config();

interface DBConfig {
  name: string;
  uri: string;
}

const DATA_DIR = path.resolve(process.cwd(), '_data');

const dbConfigs: Record<string, DBConfig> = {
  default: {
    name: 'デフォルト',
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/TEST_DB'
  },
  docker: {
    name: 'Docker',
    uri: process.env.DOCKER_MONGODB_URI || 'mongodb://mongo:27017/untitled_sekai'
  },
  local: {
    name: 'ローカル開発',
    uri: 'mongodb://localhost:27017/untitled_sekai_dev'
  },
  data_dir: {
    name: '_dataディレクトリ',
    uri: 'mongodb://localhost:27018/untitled_sekai' // 別ポートを使用
  }
};

// 現在接続中のDBの設定
let currentConfig: string = 'default';
// データディレクトリから起動したMongoDBのプロセスID
let mongodProcessId: number | null = null;

/**
 * _dataディレクトリを使用してMongoDBを起動する
 */
export const startMongoDBFromDataDir = async (): Promise<void> => {
  try {
    // データディレクトリの存在確認
    if (!existsSync(DATA_DIR)) {
      throw new Error(`データディレクトリが見つかりません: ${DATA_DIR}`);
    }

    // .wtファイルの存在確認でMongoDBデータディレクトリかチェック
    const files = await fs.readdir(DATA_DIR);
    const hasWtFiles = files.some(file => file.endsWith('.wt'));
    if (!hasWtFiles) {
      throw new Error(`${DATA_DIR} は有効なMongoDBデータディレクトリではありません`);
    }
    
    // mongodが利用可能かチェック
    try {
      await execAsync('mongod --version');
    } catch (error) {
      throw new Error('mongodbがインストールされていません。インストールしてから再試行してください。');
    }

    // 一時的なログファイルパス
    const logPath = path.join(os.tmpdir(), 'mongodb-temp.log');
    
    // すでに起動しているかどうかを確認
    try {
      await execAsync('lsof -i:27018');
      console.log('ポート27018はすでに使用されています。既存の接続を使用します。');
    } catch (error) {
      // ポートが使われていない場合はMongoDBを起動
      console.log(`${DATA_DIR} からMongoDBを起動します...`);
      
      // バックグラウンドでmongodを起動
      const cmd = `mongod --dbpath "${DATA_DIR}" --port 27018 --logpath "${logPath}" --fork`;
      await execAsync(cmd);
      
      console.log('MongoDBをポート27018で起動しました');
      
      // プロセスIDを取得
      const { stdout } = await execAsync('pgrep -f "mongod --dbpath"');
      if (stdout.trim()) {
        mongodProcessId = parseInt(stdout.trim());
        console.log(`MongoDB プロセスID: ${mongodProcessId}`);
      }
    }
  } catch (error) {
    console.error('_dataディレクトリからMongoDBを起動できません:', error);
    throw error;
  }
};

/**
 * 起動したMongoDBプロセスを停止する
 */
export const stopMongoDB = async (): Promise<void> => {
  if (mongodProcessId) {
    try {
      process.kill(mongodProcessId);
      console.log(`MongoDB プロセス ${mongodProcessId} を停止しました`);
      mongodProcessId = null;
    } catch (error) {
      console.error('MongoDBプロセスの停止に失敗しました:', error);
    }
  }
};

/**
 * 指定したデータベース設定で接続する
 * @param configKey 接続設定のキー（default, docker, localなど）
 */
export const connectDB = async (configKey: string = 'default'): Promise<void> => {
  // 既存の接続を閉じる
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // 指定された設定が存在するか確認
  if (!dbConfigs[configKey]) {
    console.error(`指定された設定 "${configKey}" は存在しません。デフォルト設定を使用します。`);
    configKey = 'default';
  }
  
  try {
    // _dataディレクトリ設定の場合は先にMongoDBを起動
    if (configKey === 'data_dir') {
      await startMongoDBFromDataDir();
    }

    const config = dbConfigs[configKey];

    if (!config) {
      throw new Error(`DB設定 "${configKey}" が見つかりません。`);
    }

    await mongoose.connect(config.uri);
    currentConfig = configKey;
    console.log(`[DB] "${config.name}" に接続しました`);
  } catch (error) {
    console.error('DBに接続できませんでした。', error);
    throw error;
  }
};

/**
 * 現在接続中のDBの設定名を取得
 */
export const getCurrentDBConfig = (): string => {
  return dbConfigs[currentConfig]?.name || 'Unknown';
};

/**
 * 利用可能なDB設定の一覧を取得
 */
export const getAvailableDBConfigs = (): string[] => {
  return Object.keys(dbConfigs).map(key => dbConfigs[key]?.name || `Unknown (${key})`);
};

/**
 * データファイルからDBにデータをインポートする
 * @param dataPath インポートするJSONファイルのパス
 */
export const importDataFromFile = async (dataPath: string): Promise<void> => {
  try {
    // ファイルの存在確認
    await fs.access(dataPath);
    
    // ファイルからデータを読み込む
    const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
    
    // DBインスタンスを取得
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('データベース接続が確立されていません');
    }
    
    // 各コレクションにデータを挿入
    for (const [collectionName, documents] of Object.entries(data)) {
      if (Array.isArray(documents) && documents.length > 0) {
        // 既存のコレクションをクリア
        await db.collection(collectionName).deleteMany({});
        
        // 新しいデータを挿入
        await db.collection(collectionName).insertMany(documents as any[]);
        console.log(`[${collectionName}] ${documents.length} 件のドキュメントをインポートしました`);
      }
    }
    
    console.log(`データのインポートが完了しました: ${dataPath}`);
  } catch (error) {
    console.error('データのインポート中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * 現在のDBデータをファイルにエクスポートする
 * @param outputPath 出力先のパス
 */
export const exportDataToFile = async (outputPath?: string): Promise<string> => {
  try {
    // 出力ファイル名の設定
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(process.cwd(), '_data', `db-export-${timestamp}.json`);
    const filePath = outputPath || defaultPath;
    
    // 出力ディレクトリの作成
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // DBからコレクション一覧を取得
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('データベース接続が確立されていません');
    }

    const collections = await db.listCollections().toArray();
    
    // 各コレクションのデータを取得
    const exportData: Record<string, any[]> = {};
    
    for (const collection of collections) {
      const collectionName = collection.name;
      // systemコレクションはスキップ
      if (collectionName.startsWith('system.')) continue;
      
      const documents = await db.collection(collectionName).find({}).toArray();
      exportData[collectionName] = documents;
      console.log(`[${collectionName}] ${documents.length} 件のドキュメントをエクスポート`);
    }
    
    // JSONファイルとして保存
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`データのエクスポートが完了しました: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('データのエクスポート中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * Docker内のMongoDBにデータをインポートする
 * @param dataPath インポートするデータファイルのパス
 * @param containerName Dockerコンテナ名
 */
export const importToDocker = async (
  dataPath: string,
  containerName: string = 'mongodb'
): Promise<void> => {
  try {
    // ファイルの存在確認
    await fs.access(dataPath);
    
    // コンテナ名の検証
    const { stdout } = await execAsync(`docker ps -q -f "name=${containerName}"`);
    if (!stdout.trim()) {
      throw new Error(`Docker コンテナ "${containerName}" が実行されていません`);
    }
    
    // ファイルをDockerコンテナにコピー
    const tempContainerPath = `/tmp/import-data.json`;
    await execAsync(`docker cp ${dataPath} ${containerName}:${tempContainerPath}`);
    
    // MongoDBにデータをインポート
    await execAsync(`docker exec ${containerName} mongoimport --db untitled_sekai --drop --file ${tempContainerPath}`);
    
    console.log(`データを Docker コンテナ "${containerName}" にインポートしました`);
  } catch (error) {
    console.error('Dockerへのデータインポート中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * Docker内のMongoDBからデータをエクスポートする
 * @param outputPath 出力先のパス
 * @param containerName Dockerコンテナ名
 */
export const exportFromDocker = async (
  outputPath?: string,
  containerName: string = 'mongodb'
): Promise<string> => {
  try {
    // 出力ファイル名の設定
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(process.cwd(), '_data', `docker-export-${timestamp}.json`);
    const filePath = outputPath || defaultPath;
    
    // 出力ディレクトリの作成
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // コンテナ名の検証
    const { stdout } = await execAsync(`docker ps -q -f "name=${containerName}"`);
    if (!stdout.trim()) {
      throw new Error(`Docker コンテナ "${containerName}" が実行されていません`);
    }
    
    // 一時ファイルパス
    const tempContainerPath = `/tmp/export-data.json`;
    
    // MongoDBからデータをエクスポート
    await execAsync(`docker exec ${containerName} mongoexport --db untitled_sekai --out ${tempContainerPath}`);
    
    // ファイルをDockerコンテナからコピー
    await execAsync(`docker cp ${containerName}:${tempContainerPath} ${filePath}`);
    
    console.log(`Docker コンテナ "${containerName}" からデータをエクスポートしました: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Dockerからのデータエクスポート中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * _dataディレクトリのデータをDockerに転送する
 * @param containerName Dockerコンテナ名
 */
export const transferDataDirToDocker = async (containerName: string = 'mongodb'): Promise<void> => {
  try {
    console.log('_dataディレクトリからDockerへデータ転送を開始します...');
    
    // 1. _dataディレクトリからのデータベース接続
    await connectDB('data_dir');
    
    // 2. データをJSONにエクスポート
    console.log('データをJSONへエクスポート中...');
    const exportPath = await exportDataToFile();
    
    // 3. エクスポートしたJSONをDockerにインポート
    console.log(`エクスポートしたデータを ${containerName} コンテナにインポート中...`);
    await importToDocker(exportPath, containerName);
    
    console.log('データの転送が完了しました。');
    
    // 4. MongoDBを停止
    await stopMongoDB();
    
  } catch (error) {
    console.error('データ転送処理中にエラーが発生しました:', error);
    throw error;
  }
};