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

	hasIdentifier(identifier: string): boolean {
		const keys = identifier.split('.')
		let localization = this._localization

		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(localization, key) && typeof localization[key] === 'object') {
				localization = localization[key] as Localization
			} else {
				return false
			}
		}

		return true
	}

	searchForLocalization(identifier: string): Localization {
		const keys = identifier.split('.')
		let localization = this._localization

		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(localization, key) && typeof localization[key] === 'object') {
				localization = localization[key] as Localization
			} else {
				return localization
			}
		}

		return localization
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

	formatMessage(identifier: string, data?: LocalizationData): string {
		// If no identifier is given, return an empty string
		if (!identifier) return ''

		const keys = identifier.split('.')
		const lastKey = keys[keys.length - 1]

		// If the identifier does not exist, return a message to the user
		if (!this.searchForLocalization(identifier)[lastKey]) return 'This identifier does not exist'

		const translationValue = this.searchForLocalization(identifier)[lastKey] as string

		return translationValue.replace(/{(\w+)}/g, function (_: string, key: string): string {
			if (data && Object.prototype.hasOwnProperty.call(data, key)) {
				return data[key] as string
			} else {
				return key
			}
		})
	}

	t(identifier: string, data?: LocalizationData): string {
		return this.formatMessage(identifier, data)
	}
}
