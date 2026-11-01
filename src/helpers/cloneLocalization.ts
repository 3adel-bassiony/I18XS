import type { Localization } from '../types/Localization'

import { emptyRecord } from './emptyRecord'
import { isObject } from './isObject'

export function cloneLocalization(value: unknown): Localization | undefined {
	if (!isObject(value)) return undefined
	const result = emptyRecord<string | Localization>()
	for (const [key, item] of Object.entries(value)) {
		if (typeof item === 'string') result[key] = item
		else {
			const nested = cloneLocalization(item)
			if (nested) result[key] = nested
		}
	}
	return result
}
