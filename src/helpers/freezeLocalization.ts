import type { Localization } from '../types/Localization'

export function freezeLocalization(localization: Localization): Localization {
	for (const value of Object.values(localization)) {
		if (typeof value === 'object') freezeLocalization(value)
	}
	return Object.freeze(localization)
}
