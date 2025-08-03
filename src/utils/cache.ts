import { createClient, RedisClientType } from 'redis';

class CacheManager {
    private client: RedisClientType | null = null;
    private isConnected = false;

    async connect(): Promise<void> {
        if (this.client) return;

        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = createClient({ url: redisUrl });
            
            this.client.on('error', (err) => {
                console.error('Redis Client Error', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Redis connection failed:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) return null;

        try {
            const cached = await this.client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Cache del error:', error);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error('Cache del pattern error:', error);
        }
    }

    // よく使われるキーの生成
    generateKey(prefix: string, ...parts: (string | number)[]): string {
        return `${prefix}:${parts.join(':')}`;
    }
}

export const cacheManager = new CacheManager();

// キャッシュのTTL設定
export const CACHE_TTL = {
    CHART_LIST: 300,      // 5分
    CHART_DETAIL: 600,    // 10分
    USER_PROFILE: 300,    // 5分
    LEVEL_LIST: 1800,     // 30分
    STORAGE_STATS: 300,   // 5分
    ANONYMOUS_LIST: 300,  // 5分
} as const;