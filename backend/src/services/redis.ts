import Redis from 'ioredis';

let redis: Redis | null = null;
let isConnected = false;

// In-memory fallback for when Redis is not available
const memoryStore: Map<string, string> = new Map();

export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    await redis.connect();
    isConnected = true;
    console.log('[Redis] Connected');

    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
      isConnected = false;
    });

    redis.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    redis.on('ready', () => {
      isConnected = true;
    });
  } catch (err) {
    console.warn('[Redis] Not available, using in-memory fallback:', (err as Error).message);
    isConnected = false;
    // Disconnect to prevent continuous retry errors
    if (redis) {
      redis.disconnect();
      redis = null;
    }
  }
}

export function getRedis(): Redis | null {
  return isConnected ? redis : null;
}

// Abstracted get/set that falls back to in-memory
export async function cacheGet(key: string): Promise<string | null> {
  if (isConnected && redis) {
    return redis.get(key);
  }
  return memoryStore.get(key) || null;
}

export async function cacheSet(key: string, value: string, exSeconds?: number): Promise<void> {
  if (isConnected && redis) {
    if (exSeconds) {
      await redis.set(key, value, 'EX', exSeconds);
    } else {
      await redis.set(key, value);
    }
  } else {
    memoryStore.set(key, value);
    if (exSeconds) {
      setTimeout(() => memoryStore.delete(key), exSeconds * 1000);
    }
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (isConnected && redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

export async function cachePublish(channel: string, message: string): Promise<void> {
  if (isConnected && redis) {
    await redis.publish(channel, message);
  }
}
