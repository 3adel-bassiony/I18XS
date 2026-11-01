import type { Catalog } from '../types/Catalog'
import type { Localization } from '../types/Localization'

import { copyCatalog } from './copyCatalog'
import { emptyRecord } from './emptyRecord'
import { freezeLocalization } from './freezeLocalization'
import { mergeInto } from './mergeInto'

export function combineCatalogs(input: Catalog, disk: Catalog): Catalog {
	if (Object.keys(input).length === 0) return copyCatalog(disk)
	const result = copyCatalog(input)
	for (const [locale, files] of Object.entries(disk)) {
		result[locale] = Object.assign(emptyRecord<Localization>(), result[locale], files)
	}
	for (const [locale, files] of Object.entries(result)) {
		const merged = emptyRecord<string | Localization>()
		for (const [name, localization] of Object.entries(input[locale] ?? {})) {
			if (name !== '__merged__') mergeInto(merged, localization)
		}
		if (input[locale]?.__merged__) mergeInto(merged, input[locale].__merged__)
		if (disk[locale]?.__merged__) mergeInto(merged, disk[locale].__merged__)
		files.__merged__ = freezeLocalization(merged)
	}
	return result
}
