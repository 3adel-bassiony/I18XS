import type { CacheEntry } from '../types/CacheEntry'

import { maxCacheEntries } from './localizationCaches'

export function remember<T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number, load: () => T): T {
	if (ttl === 0) return load()
	const now = Date.now()
	const existing = cache.get(key)
	if (existing && now >= existing.loadedAt && now - existing.loadedAt < ttl * 1000) {
		cache.delete(key)
		cache.set(key, existing)
		return existing.value
	}
	const value = load()
	cache.delete(key)
	cache.set(key, { value, loadedAt: now })
	while (cache.size > maxCacheEntries) {
		const oldest = cache.keys().next().value
		if (oldest !== undefined) cache.delete(oldest)
	}
	return value
}
