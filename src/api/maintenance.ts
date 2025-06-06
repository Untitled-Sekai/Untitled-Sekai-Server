import { sonolus } from "../index.js";
import { getMaintenanceState } from "../discord/maintenance.js";
import { RequestHandler } from "express";
import os from "os";

const serverStartTime = Date.now();

export const getServerStatus = async () => {
    sonolus.router.get('/api/status', (async (req, res) => {
        try {
            const maintenanceState = await getMaintenanceState();

            const now = new Date();
            
            const uptime = now.getTime() - serverStartTime;
            
            // 日、時間、分、秒に変換
            const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
            
            // システム情報
            const systemInfo = {
              platform: os.platform(),
              cpuUsage: process.cpuUsage(),
              memoryUsage: {
                total: os.totalmem(),
                free: os.freemem(),
                process: process.memoryUsage()
              },
              nodeVersion: process.version
            };
      
            // レスポンスを作成
            const statusData = {
              success: true,
              serverTime: now.toISOString(),
              startTime: new Date(serverStartTime).toISOString(),
              uptime: {
                total: uptime,
                formatted: `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`,
                days,
                hours,
                minutes,
                seconds
              },
              maintenance: {
                enabled: maintenanceState.enabled,
                lastUpdated: maintenanceState.lastUpdated,
                updatedBy: maintenanceState.updatedBy
              },
              system: systemInfo
            };
      
            res.json(statusData);
        } catch (error) {
            console.error('Error getting server status:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }))
}