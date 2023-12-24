import fs from 'fs'

type I18XSConfig = {
	locale?: string
	locales?: string[]
	rtlLocales?: string[]
	translations?: LocaleMessages | null
	localesDir?: string | null
}

type LocaleMessages = {
	[key: string]: string | LocaleMessages
}

type Data = Record<string, unknown>

export default class I18XS {
	locales: string[] = ['en']
	locale: string = 'en'
	rtlLocales: string[] = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug']
	localesDir: string | null = null
	translations: LocaleMessages = {}

	constructor({
		locales = ['en'],
		locale = 'en',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		localesDir = null,
		translations = null,
	}: I18XSConfig) {
		this.locales = locales
		this.locale = locale
		this.rtlLocales = rtlLocales
		this.localesDir = localesDir

		if (translations) {
			this.translations = translations
		}

		if (this.localesDir) {
			this.loadTranslations()
		}
	}

	get defaultLocale(): string {
		return 'en'
	}

	get currentLocale(): string {
		return this.locale
	}

	get supportedLocales(): string[] {
		return this.locales
	}

	get isLTR(): boolean {
		return !this.rtlLocales.includes(this.locale)
	}

	get isRTL(): boolean {
		return this.rtlLocales.includes(this.locale)
	}

	changeLocale(locale: string): I18XS {
		this.locale = locale

		this.loadTranslations()
		return this
	}

	isLocale(locale: string): boolean {
		return this.locales.includes(locale)
	}

	hasKey(identifier: string): boolean {
		const keys = identifier.split('.')
		let translations = this.translations

		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(translations, key) && typeof translations[key] === 'object') {
				translations = translations[key] as LocaleMessages
			} else {
				return false
			}
		}

		return true
	}

	loadTranslations(): void {
		try {
			const fileContents = fs.readFileSync(`${this.localesDir}/${this.locale}.json`, 'utf8')

			this.translations = JSON.parse(fileContents)
		} catch (error) {
			console.error({ 'Failed to load translations': error })
		}
	}

	searchForTranslations(identifier: string): LocaleMessages {
		const keys = identifier.split('.')
		let translations = this.translations

		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(translations, key) && typeof translations[key] === 'object') {
				translations = translations[key] as LocaleMessages
			} else {
				return translations
			}
		}

		return translations
	}

	formatMessage(identifier: string, data?: Data): string {
		// If no identifier is given, return an empty string
		if (!identifier) return ''

		const keys = identifier.split('.')
		const lastKey = keys[keys.length - 1]

		// If the identifier does not exist, return a message to the user
		if (!this.searchForTranslations(identifier)[lastKey]) return 'This identifier does not exist'

		const translationValue = this.searchForTranslations(identifier)[lastKey] as string

		return translationValue.replace(/{(\w+)}/g, function (_: string, key: string): string {
			if (data && Object.prototype.hasOwnProperty.call(data, key)) {
				return data[key] as string
			} else {
				return key
			}
		})
	}

	t(identifier: string, data?: Record<string, string>): string {
		return this.formatMessage(identifier, data)
	}
}
