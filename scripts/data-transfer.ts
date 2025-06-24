import { transferDataDirToDocker } from '../src/db/index.js';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const args = process.argv.slice(2);
const importOption = args.find(arg => arg.startsWith('--import='));
const dropOption = args.find(arg => arg === '--drop=true');
const shouldDrop = !!dropOption;

const importJsonToMongo = async (filePath: string, dropCollections = false) => {
  try {
    console.log(`JSONファイル ${filePath} からデータをインポートします...`);

    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/untitled_sekai';
    const client = new MongoClient(mongoUri);
    await client.connect();

    console.log('MongoDBに接続しました。データインポート開始...');
    const db = client.db();

    const collections = Object.keys(jsonData);
    for (const collection of collections) {
      if (Array.isArray(jsonData[collection])) {
        if (jsonData[collection].length > 0) {
          console.log(`コレクション "${collection}" を処理中... (${jsonData[collection].length}件)`);

          if (dropCollections) {
            console.log(`コレクション "${collection}" を削除します...`);
            await db.collection(collection).drop().catch(() => console.log(`コレクション "${collection}" は存在しないか、削除できませんでした。`));
          }

          await db.collection(collection).insertMany(jsonData[collection]);
          console.log(`コレクション "${collection}" のインポートが完了しました。`);
        }
      }
    }

    console.log('全てのデータのインポートが完了しました！');
    await client.close();

  } catch (error) {
    console.error('インポート処理中にエラーが発生しました:', error);
    throw error;
  }
};

const main = async () => {
  try {
    if (importOption) {
      const importFilePath = importOption.split('=')[1];
      await importJsonToMongo(importFilePath, shouldDrop);
      process.exit(0);
      return;
    }

    const containerName = process.env.CONTAINER_NAME || 'mongodb';

    console.log(`_data ディレクトリから ${containerName} コンテナへのデータ転送を開始します...`);
    await transferDataDirToDocker(containerName);

    console.log('データ転送が完了しました');
    process.exit(0);
  } catch (error) {
    console.error('データ転送中にエラーが発生しました:', error);
    process.exit(1);
  }
};

main();