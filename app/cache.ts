'use client';

type CacheData = {
  [key: string]: any;
};

// The cache object - only available on the client
let globalCache: CacheData = {};

// Initialize the cache only on the client side
if (typeof window !== 'undefined') {
  // This ensures the cache is only created in browser environments
  globalCache = {};
}

// Cache utility functions
export const cacheUtils = {
  // Set a value in the cache
  set: (key: string, value: any): void => {
    if (typeof window !== 'undefined') {
      globalCache[key] = value;
    }
  },
  
  // Get a value from the cache
  get: (key: string): any => {
    if (typeof window !== 'undefined') {
      return globalCache[key];
    }
    return undefined;
  },
  
  // Check if a key exists in the cache
  has: (key: string): boolean => {
    if (typeof window !== 'undefined') {
      return key in globalCache;
    }
    return false;
  },
  
  // Remove a key from the cache
  remove: (key: string): void => {
    if (typeof window !== 'undefined') {
      delete globalCache[key];
    }
  },
  
  // Clear the entire cache
  clear: (): void => {
    if (typeof window !== 'undefined') {
      Object.keys(globalCache).forEach(key => {
        delete globalCache[key];
      });
    }
  }
};