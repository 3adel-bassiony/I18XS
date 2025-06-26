import { isNodeJS } from './helpers/index.js'
import { Config } from './types/Config'
import { Localization } from './types/Localization'
import { LocalizationData } from './types/LocalizationData'

// Dynamic import for fs in ESM
// eslint-disable-next-line @typescript-eslint/ban-types
let fs: { readFileSync: Function; existsSync: Function } | null = null

// Only load fs if we're in Node.js
async function loadFS() {
	try {
		const module = await import('fs')
		fs = {
			readFileSync: module.readFileSync,
			existsSync: module.existsSync,
		}
	} catch (error) {
		fs = null
	}
}

// Initialize fs
loadFS()

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
	 * Indicates whether the missing identifier message should be shown.
	 */
	protected _showMissingIdentifierMessage: boolean = false

	/**
	 * The message to be displayed when a localization identifier is missing.
	 */
	protected _missingIdentifierMessage: string = 'Missing_Localization_Identifier'

	/**
	 * Array of locales that use right-to-left (RTL) writing direction.
	 */
	protected _rtlLocales: string[] = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug']

	/**
	 * The directory path where the locales are stored.
	 */
	protected _localesDir: string

	/**
	 * Indicates whether debug mode is enabled.
	 */
	protected _showLogs: boolean = false

	/**
	 * The localizations stored in memory.
	 */
	protected _localizations: Record<string, Record<string, Localization>> = {}

	/**
	 * Initializes a new instance of the I18XS class.
	 * @param {Config} config - The configuration options for I18XS.
	 * @example
	 * const i18n = new I18XS({
	 *   supportedLocales: ['en', 'fr'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 *   showMissingIdentifierMessage: true,
	 *   missingIdentifierMessage: 'Missing_Localization_Identifier',
	 *   rtlLocales: ['ar', 'he', 'fa'],
	 *   localesDir: `${process.cwd()}/src/locales`,
	 *   showLogs: true,
	 *   localizations: {},
	 * });
	 */
	constructor({
		supportedLocales = ['en'],
		currentLocale = 'en',
		fallbackLocale = 'en',
		showMissingIdentifierMessage = false,
		missingIdentifierMessage = 'Missing_Localization_Identifier',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		localesDir = isNodeJS() ? `${process.cwd()}/src/locales` : '',
		showLogs = false,
		localizations = {},
	}: Config) {
		this.configure({
			localesDir,
			supportedLocales,
			currentLocale,
			fallbackLocale,
			showMissingIdentifierMessage,
			missingIdentifierMessage,
			rtlLocales,
			showLogs,
			localizations,
		})
	}

	/**
	 * Gets the supported locales.
	 * @returns An array of supported locales.
	 * @example
	 * const i18xs = new I18XS();
	 * const locales = i18xs.supportedLocales;
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
	 * const i18xs = new I18XS();
	 * const locale = i18xs.currentLocale; // Returns the current locale, e.g. "en"
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
	 * const i18xs = new I18XS();
	 * const fallbackLocale = i18xs.fallbackLocale; // Returns the fallback locale as a string.
	 */
	get fallbackLocale(): string {
		return this._fallbackLocale
	}

	/**
	 * Determines if the current locale is left-to-right (LTR).
	 * @returns {boolean} True if the current locale is LTR, false otherwise.
	 * @example
	 * const i18xs = new I18XS();
	 * i18xs.setLocale('en');
	 * console.log(i18xs.isCurrentLocaleLTR); // Output: true
	 * i18xs.setLocale('ar');
	 * console.log(i18xs.isCurrentLocaleLTR); // Output: false
	 */
	get isCurrentLocaleLTR(): boolean {
		return !this._rtlLocales.includes(this._currentLocale)
	}

	/**
	 * Determines if the current locale is right-to-left (RTL).
	 * @returns {boolean} True if the current locale is RTL, false otherwise.
	 * @example
	 * const i18xs = new I18XS();
	 * i18xs.setLocale('ar');
	 * console.log(i18xs.isCurrentLocaleRTL); // Output: true
	 * i18xs.setLocale('en');
	 * console.log(i18xs.isCurrentLocaleRTL); // Output: false
	 */
	get isCurrentLocaleRTL(): boolean {
		return this._rtlLocales.includes(this._currentLocale)
	}

	/**
	 * Gets the debug mode status.
	 * @returns {boolean} The debug mode status.
	 * @example
	 * const i18xs = new I18XS();
	 * if (i18xs.isShowLogs) {
	 *   console.log('Debug mode is enabled');
	 * } else {
	 *   console.log('Debug mode is disabled');
	 * }
	 */
	get isShowLogs(): boolean {
		return this._showLogs
	}

	/**
	 * Configures the I18XS library with the provided options.
	 *
	 * @param {Config} options - The configuration options for I18XS.
	 *
	 * @example
	 * configure({
	 *   supportedLocales: ['en', 'fr'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 * 	 showMissingIdentifierMessage: true,
	 *	 missingIdentifierMessage: 'Missing_Localization_Identifier',
	 *   rtlLocales: ['ar', 'he', 'fa'],
	 *   localesDir: '/path/to/locales',
	 *   showLogs: true
	 * });
	 */
	configure({
		localesDir = this._localesDir,
		supportedLocales = ['en'],
		currentLocale = 'en',
		fallbackLocale = 'en',
		showMissingIdentifierMessage = false,
		missingIdentifierMessage = 'Missing_Localization_Identifier',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		showLogs = false,
		localizations = {},
	}: Config): I18XS {
		this._localesDir = localesDir
		this._supportedLocales = supportedLocales
		this._currentLocale = currentLocale
		this._fallbackLocale = fallbackLocale
		this._showMissingIdentifierMessage = showMissingIdentifierMessage
		this._missingIdentifierMessage = missingIdentifierMessage
		this._rtlLocales = rtlLocales
		this._showLogs = showLogs
		this._localizations = localizations

		return this
	}

	/**
	 * Splits the identifier into a file name and an array of keys.
	 * @param identifier - The identifier to split.
	 * @returns An object containing the file name and an array of keys.
	 * @example
	 * // Returns { fileName: 'example', keys: ['key1', 'key2'] }
	 * splitIdentifier('example.key1.key2');
	 */
	private splitIdentifier(identifier: string): { fileName: string; keys: string[] } {
		const keys = identifier.split('.')

		return {
			fileName: keys?.[0],
			keys: keys?.slice(1),
		}
	}

	/**
	 * Checks if the current environment is Node.js
	 * @returns {boolean} True if running in Node.js, false otherwise
	 */
	private isNodeJS(): boolean {
		return isNodeJS()
	}

	/**
	 * Loads the content of a localization file.
	 * Only works in Node.js environments.
	 */
	private loadFileContent(filePath: string): Localization | undefined {
		// Skip if not Node.js or fs not available
		if (!this.isNodeJS() || !fs) {
			if (this._showLogs) {
				console.debug('File system is not supported in this environment')
			}
			return undefined
		}

		try {
			const fileContents = fs.readFileSync(filePath, 'utf8')
			const localization = JSON.parse(fileContents)

			if (this._showLogs) {
				console.debug({ message: 'Loaded file content', filePath, localization })
			}

			return localization
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to load localization file content', error })
			}
		}
	}

	/**
	 * Loads the localization from memory or file system (Node.js only).
	 */
	private loadLocalization(fileName: string): Localization | undefined {
		// First check in-memory localizations
		if (this._localizations[this._currentLocale]?.[fileName]) {
			return this._localizations[this._currentLocale][fileName]
		} else if (this._localizations[this._fallbackLocale]?.[fileName]) {
			return this._localizations[this._fallbackLocale][fileName]
		}

		// Only try file system in Node.js environment
		if (!this.isNodeJS() || !fs) {
			if (this._showLogs) {
				console.debug('File system is not supported in this environment, using in-memory localizations only')
			}
			return undefined
		}

		// If not found in memory and we're in Node.js, try loading from files
		const filePath = `${this._localesDir}/${this._currentLocale}/${fileName}.json`
		const fallbackFilePath = `${this._localesDir}/${this._fallbackLocale}/${fileName}.json`

		try {
			if (fs.existsSync(filePath)) {
				return this.loadFileContent(filePath)
			} else if (fs.existsSync(fallbackFilePath)) {
				return this.loadFileContent(fallbackFilePath)
			} else {
				if (this._showLogs) {
					console.debug(
						`Localization file not found for both ${this._currentLocale} and ${this._fallbackLocale}`
					)
				}
			}
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to load localization', error })
			}
		}
	}

	/**
	 * Changes the current locale of the I18XS instance.
	 *
	 * @param {string} locale - The new locale to set.
	 * @returns {I18XS} - The updated I18XS instance.
	 *
	 * @example
	 * const i18xs = new I18XS();
	 * i18xs.changeCurrentLocale('en');
	 */
	changeCurrentLocale(locale: string): I18XS {
		if (!this._supportedLocales.includes(locale)) {
			if (this._showLogs) {
				console.error(
					`Locale ${locale} is not supported, please add it to the supported locales or change the current locale to a supported one`
				)
			}

			return this
		}

		this._currentLocale = locale

		if (this._showLogs) {
			console.debug(`Changed current locale to ${locale}`)
		}

		return this
	}

	/**
	 * Checks if the given locale is supported.
	 *
	 * @param locale The locale to check.
	 * @returns True if the locale is supported, false otherwise.
	 *
	 * @example
	 * const i18xs = new I18XS();
	 * const isSupported = i18xs.isCurrentLocale('en');
	 * console.log(isSupported); // Output: true
	 */
	isCurrentLocale(locale: string): boolean {
		return this._supportedLocales.includes(locale)
	}

	/**
	 * Checks if the given identifier exists in the localization messages.
	 *
	 * @param identifier - The identifier to search for.
	 * @returns `true` if the identifier exists, `false` otherwise.
	 *
	 * @example
	 * const i18xs = new I18XS();
	 * const exists = i18xs.hasIdentifier('welcome_message');
	 * console.log(exists); // Output: true
	 */
	hasIdentifier(identifier: string): boolean {
		const { fileName } = this.splitIdentifier(identifier)

		if (!fileName) return false

		const localization = this.loadLocalization(fileName)

		if (!localization) return false

		const message = this.searchForLocalization(identifier, localization)

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
	 * const i18xs = new I18XS();
	 * const message = "Hello, {name}! You have {count} new messages.";
	 * const data = { name: "John", count: 5 };
	 * const result = i18xs.replaceData(message, data);
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
	searchForLocalization(identifier: string, localization: Localization): string | Localization {
		return this.splitIdentifier(identifier).keys.reduce(
			(acc: Localization | string, key: string): Localization | string => {
				return typeof acc === 'object' ? acc[key] : acc
			},
			localization
		)
	}

	/**
	 * Formats a localized message based on the provided identifier and data.
	 * If the message is not found, it returns the identifier itself.
	 * If the message is a pluralization case, it selects the appropriate form based on the count in the data object.
	 * @param identifier - The identifier of the message to be formatted.
	 * @param data - Optional data object used for replacing placeholders in the message.
	 * @returns The formatted message.
	 *
	 * @example
	 * const i18xs = new I18XS();
	 * const message = i18xs.formatMessage('welcome', { name: 'John' });
	 * console.log(message); // Output: "Welcome, John!"
	 */
	formatMessage(identifier: string, data?: LocalizationData): string {
		const { fileName } = this.splitIdentifier(identifier)

		if (!fileName) {
			if (this._showMissingIdentifierMessage) {
				return this._missingIdentifierMessage
			}

			return identifier
		}

		const localization = this.loadLocalization(fileName)

		if (!localization) {
			if (this._showMissingIdentifierMessage) {
				return this._missingIdentifierMessage
			}

			return identifier
		}

		const message = this.searchForLocalization(identifier, localization)

		if (!message) {
			if (this._showMissingIdentifierMessage) {
				return this._missingIdentifierMessage
			}

			return identifier
		}

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
