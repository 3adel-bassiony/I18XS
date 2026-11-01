import { catalogCache, fileCache } from './localizationCaches'

export function clearLocalizationCache(): void {
	catalogCache.clear()
	fileCache.clear()
}
