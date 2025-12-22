import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AlgorithmDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      timestamp: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      timestamp: number;
      expiry: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AlgorithmDB>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AlgorithmDB>('leetcode-76-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

// 设置存储
export const setSetting = async (key: string, value: unknown): Promise<void> => {
  const db = await getDB();
  await db.put('settings', {
    key,
    value,
    timestamp: Date.now(),
  });
};

export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const db = await getDB();
    const result = await db.get('settings', key);
    return result ? (result.value as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// 缓存存储（带过期时间）
export const setCache = async (key: string, data: unknown, expiryMs: number): Promise<void> => {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    timestamp: Date.now(),
    expiry: expiryMs,
  });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    if (!result) return null;
    
    const now = Date.now();
    if (now - result.timestamp > result.expiry) {
      return null; // 已过期
    }
    return result.data as T;
  } catch {
    return null;
  }
};

// 获取缓存（即使过期也返回，用于fallback）
export const getCacheWithFallback = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    return result ? (result.data as T) : null;
  } catch {
    return null;
  }
};

// 常用设置的快捷方法
export const getPlaybackSpeed = () => getSetting<number>('playbackSpeed', 1);
export const setPlaybackSpeed = (speed: number) => setSetting('playbackSpeed', speed);

export const getCodeLanguage = () => getSetting<string>('codeLanguage', 'javascript');
export const setCodeLanguage = (lang: string) => setSetting('codeLanguage', lang);
