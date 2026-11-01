import type { Catalog } from '../types/Catalog'
import type { CatalogOptions } from '../types/CatalogOptions'
import type { Localization } from '../types/Localization'

import { emptyRecord } from './emptyRecord'
import { fileSystem } from './fileSystem'
import { freezeLocalization } from './freezeLocalization'
import { hasOwn } from './hasOwn'
import { catalogCache, fileCache } from './localizationCaches'
import { mergeInto } from './mergeInto'
import { readLocalization } from './readLocalization'
import { remember } from './remember'

export function loadCatalog(options: CatalogOptions, refresh = false): Catalog {
	const fs = fileSystem
	if (!fs) return emptyRecord<Record<string, Localization>>()
	const { locales, cacheTtl, showLogs } = options
	const localesDir = options.localesDir ? fs.resolvePath(options.localesDir) : ''
	const featuresDir = options.featuresDir ? fs.resolvePath(options.featuresDir) : ''
	const key = JSON.stringify([localesDir, featuresDir, [...new Set(locales)].sort()])
	if (refresh) {
		catalogCache.delete(key)
		for (const cachedKey of catalogCache.keys()) {
			const [cachedLocalesDir, cachedFeaturesDir] = JSON.parse(cachedKey) as [string, string, string[]]
			if ((localesDir && localesDir === cachedLocalesDir) || (featuresDir && featuresDir === cachedFeaturesDir))
				catalogCache.delete(cachedKey)
		}
		fileCache.clear()
	}
	return remember(catalogCache, key, cacheTtl, () => {
		const catalog = emptyRecord<Record<string, Localization>>()
		const list = (path: string): string[] => {
			try {
				return path && fs.exists(path) ? fs.readDirectory(path) : []
			} catch (error) {
				if (showLogs) console.error({ message: 'Failed to read localization directory', path, error })
				return []
			}
		}
		const add = (locale: string, name: string, path: string) => {
			// A catalog rebuild always reads fresh files; its own TTL controls reuse.
			const localization = readLocalization(path, 0, showLogs)
			if (!localization) return
			const files = catalog[locale] ?? (catalog[locale] = emptyRecord<Localization>())
			if (name !== '__merged__' && !hasOwn(files, name)) files[name] = localization
			files.__merged__ = mergeInto(files.__merged__ ?? emptyRecord<string | Localization>(), localization)
		}
		if (localesDir) {
			for (const locale of locales) {
				for (const file of list(`${localesDir}/${locale}`)) {
					if (file.endsWith('.json')) add(locale, file.slice(0, -5), `${localesDir}/${locale}/${file}`)
				}
			}
		}
		if (featuresDir) {
			for (const feature of list(featuresDir)) {
				for (const locale of locales) add(locale, feature, `${featuresDir}/${feature}/locales/${locale}.json`)
			}
		}
		for (const files of Object.values(catalog)) {
			if (files.__merged__) freezeLocalization(files.__merged__)
			Object.freeze(files)
		}
		return Object.freeze(catalog)
	})
}
