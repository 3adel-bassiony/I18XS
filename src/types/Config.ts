import { Localization } from './Localization'

export interface Config {
	supportedLocales?: string[]
	currentLocale?: string
	fallbackLocale?: string
	showMissingIdentifierMessage?: boolean
	missingIdentifierMessage?: string
	rtlLocales?: string[]
	localesDir?: string
	showLogs?: boolean
	localizations?: Record<string, Record<string, Localization>>
}
