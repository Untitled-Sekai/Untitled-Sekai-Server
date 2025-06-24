import mongoose from "mongoose";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import { createGzip } from "zlib";
import { pipeline } from "stream";

const execAsync = promisify(exec);
const pipelineAsync = promisify(pipeline);

// path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, "../../backup");

/**
 * MongoDBのバックアップを作成する
 * @returns バックアップファイルのパス
 */
export async function createDatabaseBackup(): Promise<string> {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });

        const date = new Date();
        const timestamp = date.toISOString().replace(/[:.]/g, "-").replace(/\./g, '-');
        const filename = `backup-${timestamp}.json.gz`;
        const outputPath = path.join(BACKUP_DIR, filename);
        const tempJsonPath = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

        // mongooseを使ってデータを取得
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('データベース接続が確立されていません');
        }
        const collections = await db.listCollections().toArray();
        
        // 全コレクションのデータをエクスポート
        const backupData: Record<string, any[]> = {};
        
        for (const collection of collections) {
            const collectionName = collection.name;
            // systemコレクションはスキップ
            if (collectionName.startsWith('system.')) continue;
            
            const documents = await db.collection(collectionName).find({}).toArray();
            backupData[collectionName] = documents;
        }

        // JSONとして一時保存
        await fs.writeFile(tempJsonPath, JSON.stringify(backupData, null, 2), 'utf8');
        
        // gzipに圧縮
        const gzip = createGzip();
        const source = createReadStream(tempJsonPath);

        const destination = createWriteStream(outputPath);
        
        await pipelineAsync(source, gzip, destination);
        
        // 一時ファイルを削除
        await fs.unlink(tempJsonPath);

        console.log(`データベースバックアップを作成しました: ${outputPath}`);
        return outputPath;
    } catch (e) {
        console.error("バックアップの作成に失敗しました:", e);
        throw e;
    }
}

/**
 * 指定した日数より古いバックアップファイルを削除する
 * @param daysToKeep 保持する日数
 */
export async function cleanupOldBackups(daysToKeep: number = 7): Promise<void> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = new Date();
    
    for (const file of files) {
      if (!file.startsWith('backup-')) continue;
      
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const fileAge = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (fileAge > daysToKeep) {
        await fs.unlink(filePath);
        console.log(`古いバックアップを削除しました: ${file}`);
      }
    }
  } catch (error) {
    console.error('古いバックアップの削除中にエラーが発生しました:', error);
  }
}

/**
 * データベースのバックアップを復元する
 * @param backupFilePath バックアップファイルのパス
 */
export async function restoreDatabaseBackup(backupFilePath: string): Promise<void> {
  try {
    if (!backupFilePath.endsWith('.json.gz')) {
      throw new Error('サポートされていないバックアップ形式です。.json.gz形式のファイルが必要です。');
    }

    const tempJsonPath = backupFilePath.replace('.gz', '');
    
    // gzipを解凍
    const gunzip = await import('zlib').then(zlib => zlib.createGunzip());
    const source = createReadStream(backupFilePath);
    const destination = createWriteStream(tempJsonPath);
    
    await pipelineAsync(source, gunzip, destination);
    
    // JSONを読み込む
    const backupDataStr = await fs.readFile(tempJsonPath, 'utf8');
    const backupData = JSON.parse(backupDataStr);
    
    // コレクションごとにデータを復元
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('データベース接続が確立されていません');
    }
    
    for (const [collectionName, documents] of Object.entries(backupData)) {
      if (Array.isArray(documents) && documents.length > 0) {
        // コレクションを空にしてから挿入
        await db.collection(collectionName).deleteMany({});
        if (documents.length > 0) {
          await db.collection(collectionName).insertMany(documents as any[]);
        }
      }
    }
    
    // 一時ファイルを削除
    await fs.unlink(tempJsonPath);
    
    console.log(`データベースバックアップを復元しました: ${backupFilePath}`);
  } catch (error) {
    console.error('バックアップの復元に失敗しました:', error);
    throw error;
  }
}