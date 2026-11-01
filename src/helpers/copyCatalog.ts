import type { Catalog } from '../types/Catalog'
import type { Localization } from '../types/Localization'

import { emptyRecord } from './emptyRecord'

export function copyCatalog(input: Catalog): Catalog {
	const result = emptyRecord<Record<string, Localization>>()
	for (const [locale, files] of Object.entries(input))
		result[locale] = Object.assign(emptyRecord<Localization>(), files)
	return result
}
