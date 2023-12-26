import fs from 'fs'

import { I18XSConfig } from './types/I18XSConfig'
import { Localization } from './types/Localization'
import { LocalizationData } from './types/LocalizationData'

export default class I18XS {
	/**
	 * The array of supported locales.
	 */
	protected _supportedLocales: string[] = ['en']

	/**
	 * The current locale used for internationalization.
	 */
	protected _currentLocale: string = 'en'

	/**
	 * The fallback locale used when a translation is not available in the requested locale.
	 */
	protected _fallbackLocale: string = 'en'

	/**
	 * Array of locales that use right-to-left (RTL) writing direction.
	 */
	protected _rtlLocales: string[] = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug']

	/**
	 * The directory path where the locales are stored.
	 */
	protected _localesDir: string | null = null

	/**
	 * The localization object used for storing localized strings.
	 */
	protected _localization: Localization = {}

	/**
	 * Indicates whether debug mode is enabled.
	 */
	protected _enableDebug: boolean = false

	/**
	 * Creates an instance of the I18XS class.
	 * @param {I18XSConfig} config - The configuration object for the I18XS instance.
	 * @example
	 * const i18n = new I18XS({
	 *   supportedLocales: ['en', 'fr'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 *   rtlLocales: ['ar', 'he'],
	 *   localesDir: './locales',
	 *   localization: {
	 *     en: {
	 *       greeting: 'Hello',
	 *       farewell: 'Goodbye'
	 *     },
	 *     fr: {
	 *       greeting: 'Bonjour',
	 *       farewell: 'Au revoir'
	 *     }
	 *   },
	 *   enableDebug: true
	 * });
	 */
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

	/**
	 * Gets the supported locales.
	 * @returns An array of supported locales.
	 * @example
	 * const i18n = new I18n();
	 * const locales = i18n.supportedLocales;
	 * console.log(locales); // ['en', 'fr', 'de']
	 */
	get supportedLocales(): string[] {
		return this._supportedLocales
	}

	/**
	 * Gets the current locale.
	 *
	 * @returns {string} The current locale.
	 * @example
	 * const i18n = new I18n();
	 * const locale = i18n.currentLocale; // Returns the current locale, e.g. "en"
	 */
	get currentLocale(): string {
		return this._currentLocale
	}

	/**
	 * Gets the fallback locale.
	 *
	 * @returns {string} The fallback locale.
	 *
	 * @example
	 * const i18n = new I18XS();
	 * const fallbackLocale = i18n.fallbackLocale; // Returns the fallback locale as a string.
	 */
	get fallbackLocale(): string {
		return this._fallbackLocale
	}

	/**
	 * Gets the localization object.
	 *
	 * @returns The localization object.
	 *
	 * @example
	 * // Usage
	 * const i18n = new I18XS();
	 * const localization = i18n.localization;
	 * console.log(localization); // Output: { ... } (the localization object)
	 */
	get localization(): Localization {
		return this._localization
	}

	/**
	 * Determines if the current locale is left-to-right (LTR).
	 * @returns {boolean} True if the current locale is LTR, false otherwise.
	 * @example
	 * const i18n = new I18nService();
	 * i18n.setLocale('en');
	 * console.log(i18n.isLTR); // Output: true
	 * i18n.setLocale('ar');
	 * console.log(i18n.isLTR); // Output: false
	 */
	get isLTR(): boolean {
		return !this._rtlLocales.includes(this._currentLocale)
	}

	/**
	 * Determines if the current locale is right-to-left (RTL).
	 * @returns {boolean} True if the current locale is RTL, false otherwise.
	 * @example
	 * const i18n = new I18nService();
	 * i18n.setLocale('ar');
	 * console.log(i18n.isRTL); // Output: true
	 * i18n.setLocale('en');
	 * console.log(i18n.isRTL); // Output: false
	 */
	get isRTL(): boolean {
		return this._rtlLocales.includes(this._currentLocale)
	}

	/**
	 * Gets the debug mode status.
	 * @returns {boolean} The debug mode status.
	 * @example
	 * const i18n = new I18n();
	 * if (i18n.isDebugEnabled) {
	 *   console.log('Debug mode is enabled');
	 * } else {
	 *   console.log('Debug mode is disabled');
	 * }
	 */
	get isDebugEnabled(): boolean {
		return this._enableDebug
	}

	/**
	 * Configures the I18XS library with the provided options.
	 *
	 * @param {I18XSConfig} options - The configuration options for I18XS.
	 * @returns {I18XS} - The configured I18XS instance.
	 *
	 * @example
	 * configure({
	 *   supportedLocales: ['en', 'fr'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 *   rtlLocales: ['ar', 'he', 'fa'],
	 *   localesDir: '/path/to/locales',
	 *   localization: {
	 *     en: {
	 *       greeting: 'Hello',
	 *       farewell: 'Goodbye'
	 *     },
	 *     fr: {
	 *       greeting: 'Bonjour',
	 *       farewell: 'Au revoir'
	 *     }
	 *   },
	 *   enableDebug: true
	 * });
	 */
	configure({
		supportedLocales = ['en'],
		currentLocale = 'en',
		fallbackLocale = 'en',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		localesDir = null,
		localization = null,
		enableDebug = false,
	}: I18XSConfig): I18XS {
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

		return this
	}

	/**
	 * Changes the current locale of the I18XS instance.
	 *
	 * @param {string} locale - The new locale to set.
	 * @returns {I18XS} - The updated I18XS instance.
	 *
	 * @example
	 * const i18n = new I18XS();
	 * i18n.changeCurrentLocale('en');
	 */
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

	/**
	 * Checks if the given locale is supported.
	 *
	 * @param locale The locale to check.
	 * @returns True if the locale is supported, false otherwise.
	 *
	 * @example
	 * const i18n = new I18nService();
	 * const isSupported = i18n.isCurrentLocale('en');
	 * console.log(isSupported); // Output: true
	 */
	isCurrentLocale(locale: string): boolean {
		return this._supportedLocales.includes(locale)
	}

	/**
	 * Loads the localization file based on the current locale.
	 * If the localization file for the current locale is not found, it falls back to the fallback locale.
	 * If neither the current locale nor the fallback locale files are found, no localization is loaded.
	 * @example
	 * const i18n = new I18nService();
	 * i18n.loadLocalization();
	 */
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

	/**
	 * Checks if the given identifier exists in the localization messages.
	 *
	 * @param identifier - The identifier to search for.
	 * @returns `true` if the identifier exists, `false` otherwise.
	 *
	 * @example
	 * const i18n = new I18nService();
	 * const exists = i18n.hasIdentifier('welcome_message');
	 * console.log(exists); // Output: true
	 */
	hasIdentifier(identifier: string): boolean {
		const message = this.searchForLocalization(identifier)

		if (!message) return false

		return true
	}

	/**
	 * Replaces placeholders in a message with corresponding values from the provided data object.
	 *
	 * @param message - The message containing placeholders to be replaced.
	 * @param data - The object containing key-value pairs for replacing placeholders.
	 * @returns The message with placeholders replaced by corresponding values from the data object.
	 *
	 * @example
	 * const i18n = new I18nService();
	 * const message = "Hello, {name}! You have {count} new messages.";
	 * const data = { name: "John", count: 5 };
	 * const result = i18n.replaceData(message, data);
	 * // result: "Hello, John! You have 5 new messages."
	 */
	replaceData(message: string, data?: LocalizationData): string {
		if (!data) return message

		return Object.keys(data).reduce((acc, key) => {
			return acc.replace(new RegExp(`{${key}}`, 'g'), (data?.[key] as string).toString())
		}, message)
	}

	/**
	 * Searches for a localization based on the given identifier.
	 *
	 * @param identifier - The identifier of the localization.
	 * @returns The localization value if found, otherwise the identifier itself.
	 *
	 * @example
	 * // Returns 'Hello'
	 * searchForLocalization('greeting.message')
	 *
	 * @example
	 * // Returns 'greeting.message'
	 * searchForLocalization('greeting.message.not.found')
	 */
	searchForLocalization(identifier: string): string | Localization {
		return identifier.split('.').reduce((acc: Localization | string, key: string): Localization | string => {
			return typeof acc === 'object' ? acc[key] : acc
		}, this._localization)
	}

	/**
	 * Formats a localized message based on the given identifier and data.
	 * If the message is not found, it returns 'Missing_Localization_Identifier'.
	 * If the message is an object, it handles pluralization based on the count in the data object.
	 * Otherwise, it simply replaces the data in the message and returns the formatted string.
	 *
	 * @param identifier - The identifier of the message to be localized.
	 * @param data - Optional data object used for replacing placeholders in the message.
	 * @returns The formatted localized message.
	 *
	 * @example
	 * const i18n = new I18nService();
	 * const message = i18n.formatMessage('welcome_message', { name: 'John' });
	 * console.log(message); // Output: "Welcome, John!"
	 */
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

	/**
	 * Translates the given identifier to the corresponding localized message.
	 * @param identifier - The identifier of the message to be translated.
	 * @param data - Optional data to be used for message formatting.
	 * @returns The translated message.
	 * @example
	 * // Translate a simple message
	 * const message = t('hello');
	 *
	 * // Translate a message with data
	 * const messageWithData = t('welcome', { name: 'John' });
	 */
	t(identifier: string, data?: LocalizationData): string {
		return this.formatMessage(identifier, data)
	}
}
