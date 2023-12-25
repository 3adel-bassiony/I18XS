import fs from 'fs'

import { I18XSConfig } from './types/I18XSConfig'
import { Localization } from './types/Localization'
import { LocalizationData } from './types/LocalizationData'

export default class I18XS {
	protected _supportedLocales: string[] = ['en']
	protected _currentLocale: string = 'en'
	protected _fallbackLocale: string = 'en'
	protected _rtlLocales: string[] = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug']
	protected _localesDir: string | null = null
	protected _localization: Localization = {}
	protected _enableDebug: boolean = false

	constructor({
		supportedLocales = ['en'],
		currentLocale = 'en',
		fallbackLocale = 'en',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		localesDir = null,
		localization = null,
		enableDebug = false,
	}: I18XSConfig) {
		this._supportedLocales = supportedLocales
		this._currentLocale = currentLocale
		this._fallbackLocale = fallbackLocale
		this._rtlLocales = rtlLocales
		this._localesDir = localesDir
		this._enableDebug = enableDebug

		if (localization) {
			this._localization = localization
		}

		if (this._localesDir) {
			this.loadLocalization()
		}
	}

	get supportedLocales(): string[] {
		return this._supportedLocales
	}

	get currentLocale(): string {
		return this._currentLocale
	}

	get fallbackLocale(): string {
		return this._fallbackLocale
	}

	get localization(): Localization {
		return this._localization
	}

	get isLTR(): boolean {
		return !this._rtlLocales.includes(this._currentLocale)
	}

	get isRTL(): boolean {
		return this._rtlLocales.includes(this._currentLocale)
	}

	get isDebugEnabled(): boolean {
		return this._enableDebug
	}

	changeCurrentLocale(locale: string): I18XS {
		if (!this._supportedLocales.includes(locale)) {
			if (this._enableDebug) {
				console.error(
					`Locale ${locale} is not supported, please add it to the supported locales or change the current locale to a supported one`
				)
			}

			return this
		}

		this._currentLocale = locale

		if (this._enableDebug) {
			console.debug(`Changed current locale to ${locale}`)
		}

		this.loadLocalization()
		return this
	}

	isCurrentLocale(locale: string): boolean {
		return this._supportedLocales.includes(locale)
	}

	loadLocalization(): void {
		try {
			const filePath = `${this._localesDir}/${this._currentLocale}.json`
			const fallbackFilePath = `${this._localesDir}/${this._fallbackLocale}.json`

			let fileContents: string

			if (fs.existsSync(filePath)) {
				fileContents = fs.readFileSync(filePath, 'utf8')
				this._localization = JSON.parse(fileContents)

				if (this._enableDebug) {
					console.debug({ 'Loaded localization': this._localization })
				}
			} else if (fs.existsSync(fallbackFilePath)) {
				if (this._enableDebug) {
					console.debug(
						`Localization file not found for ${this._currentLocale}, using ${this._fallbackLocale} instead`
					)
				}

				fileContents = fs.readFileSync(fallbackFilePath, 'utf8')
				this._currentLocale = this._fallbackLocale
				this._localization = JSON.parse(fileContents)

				if (this._enableDebug) {
					console.debug({ 'Loaded localization for fallback locale': this._localization })
				}
			} else {
				if (this._enableDebug) {
					console.debug(
						`Localization file not found for both ${this._currentLocale} and ${this._fallbackLocale}`
					)
				}
			}
		} catch (error) {
			if (this._enableDebug) {
				console.error({ 'Failed to load localization': error })
			}
		}
	}

	hasIdentifier(identifier: string): boolean {
		const message = this.searchForLocalization(identifier)

		if (!message) return false

		return true
	}

	replaceData(message: string, data?: LocalizationData): string {
		if (!data) return message

		return Object.keys(data).reduce((acc, key) => {
			return acc.replace(new RegExp(`{${key}}`, 'g'), (data?.[key] as string).toString())
		}, message)
	}

	searchForLocalization(identifier: string): string | Localization {
		return identifier.split('.').reduce((acc: Localization | string, key: string): Localization | string => {
			return typeof acc === 'object' ? acc[key] : acc
		}, this._localization)
	}

	formatMessage(identifier: string, data?: LocalizationData): string {
		const message = this.searchForLocalization(identifier)

		if (!message) return 'Missing_Localization_Identifier'

		// If message is an object, it's a pluralization case
		if (typeof message === 'object') {
			const count: number = data?.[Object.keys(data)[0]] as number

			switch (count) {
				case 0:
					return message.zero as string
				case 1:
					return message.one as string
				case 2:
					return message.two as string
				default:
					return this.replaceData(message.other as string, data)
			}
		}

		// Otherwise, it's a simple string
		return this.replaceData(message as string, data)
	}

	t(identifier: string, data?: LocalizationData): string {
		return this.formatMessage(identifier, data)
	}
}
