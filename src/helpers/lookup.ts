import type { Localization } from '../types/Localization'

import { hasOwn } from './hasOwn'

export function lookup(identifier: string, localization: Localization): string | Localization | undefined {
	if (!identifier) return undefined
	const keys = identifier.split('.')
	let current: string | Localization = localization
	for (let index = 0; index < keys.length; index++) {
		if (typeof current !== 'object' || current === null) return undefined
		const remaining = keys.slice(index).join('.')
		if (hasOwn(current, remaining)) return current[remaining]
		if (!hasOwn(current, keys[index])) return undefined
		current = current[keys[index]]
	}
	return current
}
