import type { Localization } from '../types/Localization'

import { emptyRecord } from './emptyRecord'
import { hasOwn } from './hasOwn'

export function mergeInto(target: Localization, source: Localization): Localization {
	for (const [key, value] of Object.entries(source)) {
		if (typeof value === 'string') target[key] = value
		else {
			const existing = hasOwn(target, key) ? target[key] : undefined
			const nested = typeof existing === 'object' ? existing : emptyRecord<string | Localization>()
			target[key] = mergeInto(nested, value)
		}
	}
	return target
}
