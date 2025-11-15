import type { PathOrFileDescriptor } from 'fs'

import { isNodeJS } from './helpers'
import { Config } from './types/Config'
import { Localization } from './types/Localization'
import { LocalizationData } from './types/LocalizationData'

// Conditionally import fs only in Node.js environments (not React Native)
type ReadFileSyncFn = (path: PathOrFileDescriptor, encoding: BufferEncoding) => string
type ExistsSyncFn = (path: PathOrFileDescriptor) => boolean
type ReaddirSyncFn = (path: PathOrFileDescriptor) => string[]

let readFileSync: ReadFileSyncFn | undefined
let existsSync: ExistsSyncFn | undefined
let readdirSync: ReaddirSyncFn | undefined

// Synchronously load fs module for Node.js/Bun environments
function loadFileSystem(): void {
	if (isNodeJS() && typeof process !== 'undefined' && process.versions?.node) {
		try {
			// Use require for synchronous loading in Node.js/Bun
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const fs = require('fs')
			readFileSync = fs.readFileSync as ReadFileSyncFn
			existsSync = fs.existsSync as ExistsSyncFn
			readdirSync = fs.readdirSync as ReaddirSyncFn
		} catch (error) {
			// fs not available (React Native, browser, etc.)
			readFileSync = undefined
			existsSync = undefined
			readdirSync = undefined
		}
	}
}

// Load fs immediately
loadFileSystem()

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
	 * The directory path where the feature folders are stored.
	 */
	protected _featuresDir: string = ''

	/**
	 * Indicates whether debug mode is enabled.
	 */
	protected _showLogs: boolean = false

	/**
	 * The localizations stored in memory.
	 */
	protected _localizations: Record<string, Record<string, Localization>> = {}

	/**
	 * Indicates whether to preload all localization files during initialization.
	 */
	protected _preloadLocalizations: boolean = true

	/**
	 * Initializes a new instance of the I18XS class.
	 * @param {Config} config - The configuration options for I18XS.
	 * @example
	 * // Node.js/Bun (with file system)
	 * const i18n = new I18XS({
	 *   supportedLocales: ['en', 'fr'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 *   localesDir: `${process.cwd()}/src/locales`,
	 *   featuresDir: `${process.cwd()}/src/features`,
	 * });
	 *
	 * @example
	 * // React Native/Browser (in-memory only)
	 * const i18n = new I18XS({
	 *   supportedLocales: ['en', 'ar'],
	 *   currentLocale: 'en',
	 *   fallbackLocale: 'en',
	 *   localizations: {
	 *     en: { general: { hello: 'Hello' } },
	 *     ar: { general: { hello: 'مرحبا' } }
	 *   }
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
		featuresDir = '',
		showLogs = false,
		localizations = {},
		preloadLocalizations = true,
	}: Config) {
		this.configure({
			localesDir,
			featuresDir,
			supportedLocales,
			currentLocale,
			fallbackLocale,
			showMissingIdentifierMessage,
			missingIdentifierMessage,
			rtlLocales,
			showLogs,
			localizations,
			preloadLocalizations,
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
	 *   featuresDir: '/path/to/features',
	 *   showLogs: true
	 * });
	 */
	configure({
		localesDir = this._localesDir,
		featuresDir = this._featuresDir,
		supportedLocales = ['en'],
		currentLocale = 'en',
		fallbackLocale = 'en',
		showMissingIdentifierMessage = false,
		missingIdentifierMessage = 'Missing_Localization_Identifier',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		showLogs = false,
		localizations = {},
		preloadLocalizations = true,
	}: Config): I18XS {
		this._localesDir = localesDir
		this._featuresDir = featuresDir
		this._supportedLocales = supportedLocales
		this._currentLocale = currentLocale
		this._fallbackLocale = fallbackLocale
		this._showMissingIdentifierMessage = showMissingIdentifierMessage
		this._missingIdentifierMessage = missingIdentifierMessage
		this._rtlLocales = rtlLocales
		this._showLogs = showLogs
		this._localizations = localizations
		this._preloadLocalizations = preloadLocalizations

		// Preload all localizations if enabled
		if (this._preloadLocalizations) {
			this.preloadAllLocalizations()
		}

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
	 * Caches a localization in memory for the specified locale and file name.
	 * This improves performance by avoiding repeated disk reads.
	 * @param locale - The locale code (e.g., 'en', 'ar')
	 * @param fileName - The localization file name
	 * @param localization - The localization data to cache
	 */
	private cacheLocalization(locale: string, fileName: string, localization: Localization): void {
		if (!this._localizations[locale]) {
			this._localizations[locale] = {}
		}
		this._localizations[locale][fileName] = localization

		if (this._showLogs) {
			console.debug({ message: 'Cached localization', locale, fileName })
		}
	}

	/**
	 * Preloads all localization files from both traditional and feature-based structures.
	 * This eliminates runtime file I/O and improves translation performance.
	 * Only works in Node.js/Bun environments with file system access.
	 *
	 * @example
	 * // Automatic preloading during initialization (default)
	 * const i18n = new I18XS({ preloadLocalizations: true });
	 *
	 * // Manual preloading
	 * i18n.preloadAllLocalizations();
	 */
	preloadAllLocalizations(): void {
		// Skip if fs is not available (React Native, browser, etc.)
		if (!readFileSync || !existsSync || !readdirSync) {
			if (this._showLogs) {
				console.debug('File system not available, skipping preload (React Native/Browser)')
			}
			return
		}

		try {
			// Preload from traditional structure (locales/{locale}/{file}.json)
			if (this._localesDir && existsSync(this._localesDir)) {
				this.preloadFromTraditionalStructure()
			}

			// Preload from feature-based structure (features/{feature}/locales/{locale}.json)
			if (this._featuresDir && existsSync(this._featuresDir)) {
				this.preloadFromFeatureStructure()
			}

			if (this._showLogs) {
				console.debug({
					message: 'Preloaded all localizations',
					locales: Object.keys(this._localizations),
					files: Object.keys(this._localizations[this._currentLocale] || {}),
				})
			}
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to preload localizations', error })
			}
		}
	}

	/**
	 * Preloads all localization files from traditional structure: locales/{locale}/{file}.json
	 */
	private preloadFromTraditionalStructure(): void {
		if (!readdirSync || !existsSync) return

		for (const locale of this._supportedLocales) {
			const localePath = `${this._localesDir}/${locale}`

			if (!existsSync(localePath)) {
				continue
			}

			try {
				const files = readdirSync(localePath)

				// Initialize merged localization for this locale if not exists
				if (!this._localizations[locale]) {
					this._localizations[locale] = {}
				}

				// Create a single merged object for all files
				if (!this._localizations[locale]['__merged__']) {
					this._localizations[locale]['__merged__'] = {}
				}

				for (const file of files) {
					if (file.endsWith('.json')) {
						const fileName = file.replace('.json', '')
						const filePath = `${localePath}/${file}`
						const localization = this.loadFileContent(filePath)

						if (localization) {
							// Cache with original file name for backward compatibility
							this.cacheLocalization(locale, fileName, localization)

							// Merge into the unified localization object (last-load-wins)
							this._localizations[locale]['__merged__'] = {
								...this._localizations[locale]['__merged__'],
								...localization,
							}

							if (this._showLogs) {
								console.debug({ message: 'Merged localization', locale, fileName })
							}
						}
					}
				}
			} catch (error) {
				if (this._showLogs) {
					console.error({ message: 'Failed to preload from traditional structure', locale, error })
				}
			}
		}
	}

	/**
	 * Preloads all localization files from feature-based structure: features/{feature}/locales/{locale}.json
	 */
	private preloadFromFeatureStructure(): void {
		if (!readdirSync || !existsSync) return

		try {
			const features = readdirSync(this._featuresDir)

			for (const feature of features) {
				const featurePath = `${this._featuresDir}/${feature}`
				const localesPath = `${featurePath}/locales`

				if (!existsSync(localesPath)) {
					continue
				}

				for (const locale of this._supportedLocales) {
					const localeFilePath = `${localesPath}/${locale}.json`

					if (existsSync(localeFilePath)) {
						const localization = this.loadFileContent(localeFilePath)

						if (localization) {
							// Cache with original feature name for backward compatibility
							this.cacheLocalization(locale, feature, localization)

							// Initialize merged localization for this locale if not exists
							if (!this._localizations[locale]) {
								this._localizations[locale] = {}
							}

							// Create a single merged object for all files
							if (!this._localizations[locale]['__merged__']) {
								this._localizations[locale]['__merged__'] = {}
							}

							// Merge into the unified localization object (last-load-wins)
							this._localizations[locale]['__merged__'] = {
								...this._localizations[locale]['__merged__'],
								...localization,
							}

							if (this._showLogs) {
								console.debug({ message: 'Merged localization', locale, feature })
							}
						}
					}
				}
			}
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to preload from feature structure', error })
			}
		}
	}

	/**
	 * Loads the content of a localization file synchronously.
	 * Uses Node.js/Bun's fs module for synchronous file operations.
	 * Not available in React Native - use in-memory localizations instead.
	 */
	private loadFileContent(filePath: string): Localization | undefined {
		// Skip if fs is not available (React Native, browser, etc.)
		if (!readFileSync || !existsSync) {
			if (this._showLogs) {
				console.debug('File system is not available in this environment (React Native/Browser)')
			}
			return undefined
		}

		try {
			// Check if file exists
			if (!existsSync(filePath)) {
				return undefined
			}

			// Read and parse JSON synchronously
			const content = readFileSync(filePath, 'utf8')
			const localization = JSON.parse(content)

			if (this._showLogs) {
				console.debug({ message: 'Loaded file content', filePath, localization })
			}

			return localization
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to load localization file content', error })
			}
			return undefined
		}
	}

	/**
	 * Loads the localization from memory or file system.
	 * Performance-optimized to only check configured directories:
	 * - If only localesDir: Traditional structure only
	 * - If only featuresDir: Feature-based structure only
	 * - If both: Tries traditional first, then feature-based
	 *
	 * Note: File system operations only work in Node.js/Bun.
	 * For React Native/Browser, use in-memory localizations.
	 */
	private loadLocalization(fileName: string): Localization | undefined {
		// If preloading is enabled, always try to use the merged localization first
		if (this._preloadLocalizations) {
			if (this._localizations[this._currentLocale]?.['__merged__']) {
				return this._localizations[this._currentLocale]['__merged__']
			} else if (this._localizations[this._fallbackLocale]?.['__merged__']) {
				return this._localizations[this._fallbackLocale]['__merged__']
			}
		}

		// Fall back to individual file loading (backward compatibility for lazy loading)
		if (this._localizations[this._currentLocale]?.[fileName]) {
			return this._localizations[this._currentLocale][fileName]
		} else if (this._localizations[this._fallbackLocale]?.[fileName]) {
			return this._localizations[this._fallbackLocale][fileName]
		}

		// Skip file system if fs is not available (React Native, browser, etc.)
		if (!readFileSync || !existsSync) {
			if (this._showLogs) {
				console.debug('File system not available, using in-memory localizations only (React Native/Browser)')
			}
			return undefined
		}

		try {
			const hasLocalesDir = !!this._localesDir
			const hasFeaturesDir = !!this._featuresDir

			// Performance optimization: Only check configured directories
			if (hasLocalesDir && !hasFeaturesDir) {
				// Only traditional structure configured - check only that
				return this.loadFromTraditionalStructure(fileName)
			} else if (hasFeaturesDir && !hasLocalesDir) {
				// Only feature-based structure configured - check only that
				return this.loadFromFeatureStructure(fileName)
			} else if (hasLocalesDir && hasFeaturesDir) {
				// Both configured - try traditional first, then feature-based
				const localization = this.loadFromTraditionalStructure(fileName)
				if (localization) {
					return localization
				}
				return this.loadFromFeatureStructure(fileName)
			}

			if (this._showLogs) {
				console.debug('No localesDir or featuresDir configured')
			}

			return undefined
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to load localization', error })
			}
			return undefined
		}
	}

	/**
	 * Loads from traditional structure: locales/{locale}/{file}.json
	 */
	private loadFromTraditionalStructure(fileName: string): Localization | undefined {
		const filePath = `${this._localesDir}/${this._currentLocale}/${fileName}.json`
		const fallbackFilePath = `${this._localesDir}/${this._fallbackLocale}/${fileName}.json`

		let localization = this.loadFileContent(filePath)
		if (localization) {
			// Cache the loaded localization
			this.cacheLocalization(this._currentLocale, fileName, localization)
			return localization
		}

		localization = this.loadFileContent(fallbackFilePath)
		if (localization) {
			// Cache the loaded localization
			this.cacheLocalization(this._fallbackLocale, fileName, localization)
			return localization
		}

		return undefined
	}

	/**
	 * Loads from feature-based structure: features/{feature}/locales/{locale}.json
	 */
	private loadFromFeatureStructure(fileName: string): Localization | undefined {
		const featureFilePath = `${this._featuresDir}/${fileName}/locales/${this._currentLocale}.json`
		const featureFallbackPath = `${this._featuresDir}/${fileName}/locales/${this._fallbackLocale}.json`

		let localization = this.loadFileContent(featureFilePath)
		if (localization) {
			// Cache the loaded localization
			this.cacheLocalization(this._currentLocale, fileName, localization)
			return localization
		}

		localization = this.loadFileContent(featureFallbackPath)
		if (localization) {
			// Cache the loaded localization
			this.cacheLocalization(this._fallbackLocale, fileName, localization)
			return localization
		}

		return undefined
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
	 * Supports both flat keys with dots (e.g., "api.error.message") and nested objects.
	 *
	 * @param identifier - The identifier of the localization.
	 * @returns The localization value if found, otherwise undefined.
	 *
	 * @example
	 * // Returns 'Hello' from nested: { greeting: { message: 'Hello' } }
	 * searchForLocalization('greeting.message', localization)
	 *
	 * @example
	 * // Returns 'API Error' from flat: { "api.error.message": "API Error" }
	 * searchForLocalization('api.error.message', localization)
	 */
	searchForLocalization(identifier: string, localization: Localization): string | Localization | undefined {
		const { keys } = this.splitIdentifier(identifier)

		// First, try to find the key as a flat string with dots
		// e.g., "api.error.message" as a single key
		const flatKey = keys.join('.')
		if (typeof localization === 'object' && flatKey in localization) {
			return localization[flatKey]
		}

		// If not found as flat key, try nested navigation
		// e.g., localization['api']['error']['message']
		const result = keys.reduce<Localization | string | undefined>((acc, key) => {
			if (acc === undefined) return undefined
			return typeof acc === 'object' ? acc[key] : acc
		}, localization)

		return result
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
	 * // With preloading enabled (simplified API - no file prefix needed)
	 * const i18xs = new I18XS({ preloadLocalizations: true });
	 * const message = i18xs.formatMessage('Welcome_Message', { name: 'John' });
	 * console.log(message); // Output: "Welcome, John!"
	 *
	 * @example
	 * // With namespace support
	 * const message = i18xs.formatMessage('Bank_Accounts.Welcome_Message', { name: 'John' });
	 * console.log(message); // Output: "Welcome to Bank Accounts, John!"
	 *
	 * @example
	 * // Traditional API (with file prefix) still works
	 * const message = i18xs.formatMessage('general.Welcome_Message', { name: 'John' });
	 * console.log(message); // Output: "Welcome, John!"
	 */
	formatMessage(identifier: string, data?: LocalizationData): string {
		// When preloading is enabled, try merged localization first (no file prefix needed)
		if (this._preloadLocalizations) {
			const mergedLocalization =
				this._localizations[this._currentLocale]?.['__merged__'] ||
				this._localizations[this._fallbackLocale]?.['__merged__']

			if (mergedLocalization) {
				// Try to find the key directly in merged localizations (without file prefix)
				let message = this.searchForLocalizationDirect(identifier, mergedLocalization)

				// If not found and identifier contains a dot, try without the file prefix (backward compatibility)
				// e.g., 'general.Hello_World' → 'Hello_World'
				if (!message && identifier.includes('.')) {
					const { keys } = this.splitIdentifier(identifier)
					const identifierWithoutFile = keys.join('.')

					if (identifierWithoutFile) {
						message = this.searchForLocalizationDirect(identifierWithoutFile, mergedLocalization)
					}
				}

				if (message) {
					return this.formatMessageValue(message, data)
				}

				// Key not found in merged localizations
				if (this._showMissingIdentifierMessage) {
					return this._missingIdentifierMessage
				}
				return identifier
			}
		}

		// Fall back to traditional file-based approach
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

		return this.formatMessageValue(message, data)
	}

	/**
	 * Formats the actual message value (handles pluralization and data replacement)
	 * @param message - The message value (string or pluralization object)
	 * @param data - Optional data object for placeholders
	 * @returns The formatted message string
	 */
	private formatMessageValue(message: string | Localization, data?: LocalizationData): string {
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
	 * Searches for a localization directly by identifier (without file prefix)
	 * Supports nested keys with dots (e.g., "Bank_Accounts.Welcome_Message")
	 * @param identifier - The full identifier (e.g., "Welcome_Message" or "Bank_Accounts.Welcome_Message")
	 * @param localization - The merged localization object
	 * @returns The localization value if found, otherwise undefined
	 */
	private searchForLocalizationDirect(
		identifier: string,
		localization: Localization
	): string | Localization | undefined {
		const keys = identifier.split('.')

		// First, try to find the key as a flat string with dots
		if (identifier in localization) {
			return localization[identifier]
		}

		// If not found as flat key, try nested navigation
		const result = keys.reduce<Localization | string | undefined>((acc, key) => {
			if (acc === undefined) return undefined
			return typeof acc === 'object' ? acc[key] : acc
		}, localization)

		return result
	}

	/**
	 * Translates the given identifier to the corresponding localized message.
	 * Automatically detects and loads from traditional or feature-based folder structures.
	 * @param identifier - The identifier of the message to be translated.
	 * @param data - Optional data to be used for message formatting.
	 * @returns The translated message.
	 *
	 * @example
	 * // With preloading enabled (default) - Simplified API without file prefix
	 * const i18n = new I18XS({ preloadLocalizations: true });
	 * const message = i18n.t('Hello_World'); // No file prefix needed!
	 * const welcome = i18n.t('Welcome_Message', { name: 'John' });
	 *
	 * @example
	 * // Namespace support - organize keys with nested objects
	 * const message = i18n.t('Bank_Accounts.Welcome_Message'); // Access nested keys
	 * const error = i18n.t('Validation.Email.Invalid');
	 *
	 * @example
	 * // Traditional API (with file prefix) still works for backward compatibility
	 * const message = i18n.t('general.Hello_World');
	 * const featureMessage = i18n.t('foo.Hello_World');
	 */
	t(identifier: string, data?: LocalizationData): string {
		return this.formatMessage(identifier, data)
	}
}
