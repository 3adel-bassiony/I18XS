import type { Localization } from '#types/Localization'

export type Config = {
	supportedLocales?: readonly string[]
	currentLocale?: string
	fallbackLocale?: string
	useFallbackLocale?: boolean
	showMissingIdentifierMessage?: boolean
	missingIdentifierMessage?: string
	rtlLocales?: readonly string[]
	localesDir?: string
	featuresDir?: string
	showLogs?: boolean
	localizations?: Record<string, Record<string, Localization>>
	preloadLocalizations?: boolean
	/** Shared disk-cache lifetime in seconds. Defaults to Infinity; zero disables shared caching. */
	cacheTtl?: number
}
