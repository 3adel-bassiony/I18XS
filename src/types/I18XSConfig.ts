import { Localization } from './Localization'

export type I18XSConfig = {
	supportedLocales?: string[]
	currentLocale?: string
	fallbackLocale?: string
	showMissingIdentifierMessage?: boolean
	missingIdentifierMessage?: string
	rtlLocales?: string[]
	localization?: Localization | null
	localesDir?: string | null
	showLogs?: boolean
}
