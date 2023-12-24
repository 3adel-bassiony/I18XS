import { Localization } from './Localization'

export type I18XSConfig = {
	supportedLocales?: string[]
	currentLocale?: string
	fallbackLocale?: string
	rtlLocales?: string[]
	localization?: Localization | null
	localesDir?: string | null
	enableDebug?: boolean
}
