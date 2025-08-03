import { cacheManager } from './cache.js';

export class CacheInvalidation {
    // 譜面関連のキャッシュをクリア
    static async clearChartCaches(chartName?: string): Promise<void> {
        if (chartName) {
            // 特定の譜面のキャッシュをクリア
            await cacheManager.del(cacheManager.generateKey('chart', 'detail', chartName));
        }
        
        // 一覧系のキャッシュをクリア
        await cacheManager.delPattern('charts:list:*');
        await cacheManager.delPattern('levels:formatted*');
    }

    // ユーザー関連のキャッシュをクリア
    static async clearUserCaches(userId: string): Promise<void> {
        await cacheManager.del(cacheManager.generateKey('user', 'profile', userId));
        await cacheManager.del(cacheManager.generateKey('user', 'anonymous', userId));
    }
}