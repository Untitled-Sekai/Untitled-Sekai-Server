// メンテナンス状態の取得と保存を行うモジュール
// メンテナンス状態はJSONファイルに保存され、アプリケーションの起動時に読み込まれます。
import { MaintenanceState } from "./type.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAINTENANCE_STATE_PATH = path.join(__dirname, '../../data/maintenance-state.json');

export async function getMaintenanceState(): Promise<MaintenanceState> {
    try {
        const data = await fs.readFile(MAINTENANCE_STATE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {
            enabled: false,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        };
    }
}

export async function saveMaintenanceState(state: MaintenanceState): Promise<void> {
    try {
        // ディレクトリ、データが存在しない場合は作成
        await fs.mkdir(path.dirname(MAINTENANCE_STATE_PATH), { recursive: true }).catch(() => { });
        await fs.writeFile(MAINTENANCE_STATE_PATH, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error('メンテナンス状態の保存に失敗:', error);
    }
}