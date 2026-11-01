import type { Catalog } from '../types/Catalog'
import type { Localization } from '../types/Localization'

import { cloneLocalization } from './cloneLocalization'
import { emptyRecord } from './emptyRecord'
import { freezeLocalization } from './freezeLocalization'
import { isObject } from './isObject'

export function cloneCatalog(input: Catalog): Catalog {
	const result = emptyRecord<Record<string, Localization>>()
	for (const [locale, files] of Object.entries(input)) {
		if (!isObject(files)) continue
		result[locale] = emptyRecord<Localization>()
		for (const [name, value] of Object.entries(files)) {
			const localization = cloneLocalization(value)
			if (localization) result[locale][name] = freezeLocalization(localization)
		}
	}
	return result
}
