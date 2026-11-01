import type { Localization } from '../types/Localization'

import { cloneLocalization } from './cloneLocalization'
import { fileSystem } from './fileSystem'
import { freezeLocalization } from './freezeLocalization'
import { fileCache } from './localizationCaches'
import { remember } from './remember'

export function readLocalization(filePath: string, cacheTtl: number, showLogs: boolean): Localization | undefined {
	const fs = fileSystem
	if (!fs) return undefined
	const path = fs.resolvePath(filePath)
	return remember(fileCache, path, cacheTtl, () => {
		try {
			if (!fs.exists(path)) return undefined
			const localization = cloneLocalization(JSON.parse(fs.readFile(path)))
			return localization ? freezeLocalization(localization) : undefined
		} catch (error) {
			if (showLogs) console.error({ message: 'Failed to load localization file', path, error })
			return undefined
		}
	})
}
