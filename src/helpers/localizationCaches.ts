import type { CacheEntry } from '../types/CacheEntry'
import type { Catalog } from '../types/Catalog'
import type { Localization } from '../types/Localization'

export const catalogCache = new Map<string, CacheEntry<Catalog>>()
export const fileCache = new Map<string, CacheEntry<Localization | undefined>>()
export const maxCacheEntries = 128
