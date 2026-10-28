/**
 * CareerMatch AI Cache Management Utility
 * Handles safe, non-essential client-side caching for API responses and temporary data.
 * Does NOT clear authentication tokens, saved resumes, user settings, or database records.
 */

const CACHE_PREFIX = 'careermatch_cache_';
const SERVICE_CACHE_PREFIX = 'careermatch-';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export const appCache = {
  /**
   * Store disposable data in client cache with a TTL (default 10 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = 10 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttlMs,
      };
      sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {}
  },

  /**
   * Retrieve cached data if not expired
   */
  get<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttlMs) {
        sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Remove a single cached key
   */
  remove(key: string): void {
    try {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch {}
  },
};

export interface ClearCacheResult {
  success: boolean;
  clearedItemsCount: number;
  cacheCategoriesCleared: string[];
  error?: string;
}

/**
 * Clear safe, non-essential cached data created by CareerMatch AI.
 * Explicitly preserves:
 * - Supabase auth tokens ('sb-token', 'sb-*')
 * - User auth state ('auth-store')
 * - Saved resumes ('resume-store')
 * - Saved analyses ('analysis-store')
 * - User theme preference ('careermatch_theme')
 * - Custom OpenAI API keys ('user_openai_key')
 */
export async function clearCareerMatchCache(): Promise<ClearCacheResult> {
  let clearedCount = 0;
  const categories: string[] = [];

  try {
    // 1. Clear disposable sessionStorage keys
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      // Match CareerMatch cache entries or temporary prefill states
      if (
        key.startsWith(CACHE_PREFIX) ||
        key === 'matcher_prefill_job' ||
        key.startsWith('careermatch_temp_')
      ) {
        sessionKeysToRemove.push(key);
      }
    }

    for (const key of sessionKeysToRemove) {
      sessionStorage.removeItem(key);
      clearedCount++;
    }
    if (sessionKeysToRemove.length > 0) {
      categories.push('Temporary Session Cache');
    }

    // 2. Clear disposable localStorage cache entries (NOT stores or auth)
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(CACHE_PREFIX) || key.startsWith('careermatch_api_cache_')) {
        localKeysToRemove.push(key);
      }
    }

    for (const key of localKeysToRemove) {
      localStorage.removeItem(key);
      clearedCount++;
    }
    if (localKeysToRemove.length > 0) {
      categories.push('Local API Response Cache');
    }

    // 3. Clear Cache API (Service Worker / HTTP caches) owned by CareerMatch AI only
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheNames = await window.caches.keys();
        const appCaches = cacheNames.filter((name) =>
          name.toLowerCase().startsWith(SERVICE_CACHE_PREFIX)
        );
        for (const name of appCaches) {
          await window.caches.delete(name);
          clearedCount++;
        }
        if (appCaches.length > 0) {
          categories.push('Browser HTTP Cache Storage');
        }
      } catch {}
    }

    if (categories.length === 0) {
      categories.push('Application Memory Cache');
    }

    return {
      success: true,
      clearedItemsCount: clearedCount,
      cacheCategoriesCleared: categories,
    };
  } catch (err) {
    return {
      success: false,
      clearedItemsCount: clearedCount,
      cacheCategoriesCleared: categories,
      error: (err as Error).message || 'Failed to clear cache',
    };
  }
}
