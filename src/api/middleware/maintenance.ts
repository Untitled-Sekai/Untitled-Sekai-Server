import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { getMaintenanceState } from '../../discord/maintenance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAINTENANCE_HTML_PATH = path.join(__dirname, '../../../static/maintenance.html');

export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/') || req.path === '/api/status') {
      return next();
    }

    if (req.path === '/maintenance.html') {
      return next();
    }

    const state = await getMaintenanceState();
    
    if (state.enabled) {
      try {
        let html = await fs.readFile(MAINTENANCE_HTML_PATH, 'utf-8');
        
        if (state.estimatedRecovery) {
          html = html.replace('予定復旧時間: xxxx年x月xx日 00:00', `予定復旧時間: ${state.estimatedRecovery}`);
        }
        
        res.status(503).send(html);
      } catch (error) {
        res.status(503).send('現在メンテナンス中です。しばらくお待ちください。');
      }
      return;
    }

    next();
  } catch (error) {
    console.error('メンテナンスチェックエラー:', error);
    next();
  }
};