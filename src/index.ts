import type { PathOrFileDescriptor } from 'fs'

import { isNodeJS } from './helpers'
import { Config } from './types/Config'
import { Localization } from './types/Localization'
import { LocalizationData } from './types/LocalizationData'
import { LocalizedValue } from './types/LocalizedValue'

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
			const value = data?.[key]
			// Handle null, undefined, and other non-string values safely
			const replacement = value !== null && value !== undefined ? String(value) : ''
			return acc.replace(new RegExp(`{${key}}`, 'g'), replacement)
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
		if (typeof message === 'object' && message !== null) {
			// Validate that this is a pluralization object
			if (!this.isPluralizationObject(message)) {
				// Not a valid pluralization object, return as-is or show error
				if (this._showLogs) {
					console.warn({ message: 'Invalid pluralization object', data: message })
				}
				return this._showMissingIdentifierMessage ? this._missingIdentifierMessage : ''
			}

			// Extract count from data - look for 'count' key or first numeric value
			let count = 0
			if (data) {
				// Prefer explicit 'count' key
				if ('count' in data && typeof data.count === 'number') {
					count = data.count
				} else {
					// Fall back to first key's value if it's a number
					const firstKey = Object.keys(data)[0]
					if (firstKey && typeof data[firstKey] === 'number') {
						count = data[firstKey] as number
					}
				}
			}

			// Select appropriate plural form
			let selectedForm: string | undefined

			switch (count) {
				case 0:
					selectedForm = message.zero as string | undefined
					break
				case 1:
					selectedForm = message.one as string | undefined
					break
				case 2:
					selectedForm = message.two as string | undefined
					break
				default:
					selectedForm = message.other as string | undefined
			}

			// Fall back to 'other' if specific form doesn't exist
			if (!selectedForm) {
				selectedForm = message.other as string | undefined
			}

			// If still no form found, return error or empty
			if (!selectedForm || typeof selectedForm !== 'string') {
				if (this._showLogs) {
					console.warn({ message: 'No valid plural form found', count, pluralData: message })
				}
				return this._showMissingIdentifierMessage ? this._missingIdentifierMessage : ''
			}

			return this.replaceData(selectedForm, data)
		}

		// Otherwise, it's a simple string
		return this.replaceData(message as string, data)
	}

	/**
	 * Checks if an object is a valid pluralization object.
	 * A valid pluralization object should have at least 'other' property and be an object.
	 * @param obj - The object to check
	 * @returns True if it's a valid pluralization object
	 */
	private isPluralizationObject(obj: Localization): boolean {
		if (typeof obj !== 'object' || obj === null) {
			return false
		}

		// Must have at least the 'other' key for plural forms
		return 'other' in obj || 'zero' in obj || 'one' in obj || 'two' in obj
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

	/**
	 * Localizes a value based on the provided locale file and value.
	 * @param localeFile - The locale file to use.
	 * @param value - The value to localize.
	 * @param data - Optional data to be used for message formatting.
	 * @returns The localized value.
	 *
	 * @example
	 * const localizedValue = i18n.localizeValue('common', 'Hello_World', { name: 'John' });
	 * console.log(localizedValue); // Output: { id: "Hello_World", title: "Hello John" }
	 */
	localizeValue(localeFile: string, value: string | null | undefined, data?: LocalizationData): LocalizedValue {
		if (value === null || value === undefined) {
			return {
				id: value,
				title: this._showMissingIdentifierMessage ? this._missingIdentifierMessage : '',
			}
		}

		return {
			id: value,
			title: this.formatMessage(`${localeFile}.${value}`, data),
		}
	}

	/**
	 * Extracts the localized string value from an object using the current locale as the key.
	 * Useful for objects with locale-keyed values like: { en: "Hello", ar: "مرحبا" }
	 *
	 * @param localizedObject - An object with locale codes as keys and localized strings as values
	 * @returns The string value for the current locale, or null if not found or object is null/undefined
	 *
	 * @example
	 * const name = { en: "Product", ar: "منتج" };
	 * const localizedName = i18n.getLocalizedValue(name); // Returns "Product" if currentLocale is "en"
	 */
	getLocalizedValue(localizedObject?: Record<string, string> | null): string | null {
		if (!localizedObject) return null

		return localizedObject[this.currentLocale] ?? null
	}

	/**
	 * Extracts a localized property from an entity based on the current locale.
	 * Useful for database entities with separate columns per locale (e.g., nameEn, nameAr).
	 *
	 * @param entity - The entity object containing localized properties
	 * @param basePropertyName - The base property name without the locale suffix
	 * @param formatSuffix - Optional function to format the locale suffix. Defaults to capitalizing first letter (e.g., 'en' -> 'En')
	 * @returns The localized property value, or null if not found or entity is null/undefined
	 *
	 * @example
	 * // Default behavior: capitalizes first letter
	 * const product = { nameEn: "Coffee", nameAr: "قهوة" };
	 * const name = i18n.getLocalizedProperty(product, "name"); // Returns "Coffee" if currentLocale is "en"
	 *
	 * @example
	 * // Custom suffix formatter for uppercase
	 * const user = { title_EN: "Manager", title_AR: "مدير" };
	 * const title = i18n.getLocalizedProperty(user, "title_", (locale) => locale.toUpperCase());
	 *
	 * @example
	 * // Custom suffix formatter for underscore notation
	 * const item = { description_en: "Item", description_ar: "عنصر" };
	 * const desc = i18n.getLocalizedProperty(item, "description_", (locale) => locale);
	 */
	getLocalizedProperty(
		entity: unknown,
		basePropertyName: string,
		formatSuffix?: (locale: string) => string
	): string | null {
		if (!entity || typeof entity !== 'object') return null

		// Default formatter: capitalize first letter (e.g., 'en' -> 'En')
		const defaultFormatter = (locale: string): string => {
			return locale.charAt(0).toUpperCase() + locale.slice(1).toLowerCase()
		}

		const formatter = formatSuffix ?? defaultFormatter
		const propertyName = `${basePropertyName}${formatter(this.currentLocale)}`

		const value = (entity as Record<string, unknown>)[propertyName]

		return typeof value === 'string' ? value : null
	}

	/**
	 * Formats a number according to the current locale.
	 * Uses the Intl.NumberFormat API for locale-aware number formatting.
	 *
	 * @param value - The number to format
	 * @param options - Optional Intl.NumberFormatOptions for customization
	 * @returns The formatted number string
	 *
	 * @example
	 * // Basic number formatting
	 * i18n.formatNumber(1234567.89)
	 * // en: "1,234,567.89"
	 * // ar: "١٬٢٣٤٬٥٦٧٫٨٩"
	 * // de: "1.234.567,89"
	 *
	 * @example
	 * // With decimal places
	 * i18n.formatNumber(42.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	 * // "42.50"
	 *
	 * @example
	 * // With grouping disabled
	 * i18n.formatNumber(1234567, { useGrouping: false })
	 * // "1234567"
	 *
	 * @example
	 * // Scientific notation
	 * i18n.formatNumber(123456, { notation: 'scientific' })
	 * // "1.23E5"
	 *
	 * @example
	 * // Compact notation
	 * i18n.formatNumber(1234567, { notation: 'compact' })
	 * // en: "1.2M"
	 * // ar: "١٫٢ مليون"
	 */
	formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
		try {
			const formatter = new Intl.NumberFormat(this._currentLocale, options)
			return formatter.format(value)
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to format number', value, error })
			}
			// Fallback to basic toString
			return value.toString()
		}
	}

	/**
	 * Formats a currency value according to the current locale.
	 * Uses the Intl.NumberFormat API with currency-specific formatting.
	 *
	 * @param value - The numeric value to format
	 * @param currency - The ISO 4217 currency code (e.g., 'USD', 'EUR', 'SAR', 'EGP')
	 * @param options - Optional Intl.NumberFormatOptions for customization
	 * @returns The formatted currency string
	 *
	 * @example
	 * // Basic currency formatting
	 * i18n.formatCurrency(99.99, 'USD')
	 * // en: "$99.99"
	 * // ar: "٩٩٫٩٩ US$"
	 * // de: "99,99 $"
	 *
	 * @example
	 * // Arabic Riyal
	 * i18n.changeCurrentLocale('ar')
	 * i18n.formatCurrency(1500, 'SAR')
	 * // "١٬٥٠٠٫٠٠ ر.س."
	 *
	 * @example
	 * // Egyptian Pound
	 * i18n.formatCurrency(250.5, 'EGP')
	 * // en: "EGP 250.50"
	 * // ar: "٢٥٠٫٥٠ ج.م."
	 *
	 * @example
	 * // With custom display (symbol, code, name)
	 * i18n.formatCurrency(99.99, 'EUR', { currencyDisplay: 'code' })
	 * // "EUR 99.99"
	 *
	 * i18n.formatCurrency(99.99, 'EUR', { currencyDisplay: 'name' })
	 * // en: "99.99 euros"
	 *
	 * @example
	 * // Without decimal places
	 * i18n.formatCurrency(99.99, 'USD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
	 * // "$100"
	 *
	 * @example
	 * // Accounting format (shows negatives in parentheses)
	 * i18n.formatCurrency(-50, 'USD', { currencySign: 'accounting' })
	 * // "($50.00)"
	 */
	formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string {
		try {
			const formatter = new Intl.NumberFormat(this._currentLocale, {
				style: 'currency',
				currency,
				...options,
			})
			return formatter.format(value)
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to format currency', value, currency, error })
			}
			// Fallback to basic formatting
			return `${currency} ${value.toFixed(2)}`
		}
	}

	/**
	 * Gets the text direction for the current locale.
	 * Returns 'rtl' for right-to-left languages, 'ltr' otherwise.
	 * Useful for setting the HTML dir attribute.
	 *
	 * @returns The text direction: 'ltr' or 'rtl'
	 *
	 * @example
	 * // Using with HTML
	 * <html dir={i18n.getTextDirection()}>
	 *
	 * @example
	 * // Using in React
	 * function App() {
	 *   const direction = i18n.getTextDirection()
	 *   return <div dir={direction}>Content</div>
	 * }
	 *
	 * @example
	 * // Conditional styling
	 * const marginStart = i18n.getTextDirection() === 'rtl' ? 'marginRight' : 'marginLeft'
	 *
	 * @example
	 * i18n.changeCurrentLocale('en')
	 * i18n.getTextDirection() // 'ltr'
	 *
	 * i18n.changeCurrentLocale('ar')
	 * i18n.getTextDirection() // 'rtl'
	 */
	get textDirection(): 'ltr' | 'rtl' {
		return this.isCurrentLocaleRTL ? 'rtl' : 'ltr'
	}

	/**
	 * Finds missing translation keys across all supported locales.
	 * Compares each locale against all others to identify missing keys.
	 * Useful for development, testing, and CI/CD pipelines to ensure translation completeness.
	 *
	 * @returns An object mapping each locale to an array of missing key paths
	 *
	 * @example
	 * // Basic usage
	 * const missing = i18n.findMissingKeys()
	 * console.log(missing)
	 * // {
	 * //   ar: ['welcome.title', 'profile.settings.theme'],
	 * //   fr: ['welcome.subtitle']
	 * // }
	 *
	 * @example
	 * // Check if all locales are complete
	 * const missing = i18n.findMissingKeys()
	 * const hasErrors = Object.values(missing).some(keys => keys.length > 0)
	 * if (hasErrors) {
	 *   console.error('Missing translations detected!', missing)
	 * }
	 *
	 * @example
	 * // Use in CI/CD
	 * const missing = i18n.findMissingKeys()
	 * if (Object.keys(missing).length > 0) {
	 *   process.exit(1) // Fail the build
	 * }
	 *
	 * @example
	 * // Display in development UI
	 * const missing = i18n.findMissingKeys()
	 * Object.entries(missing).forEach(([locale, keys]) => {
	 *   if (keys.length > 0) {
	 *     console.warn(`Locale '${locale}' is missing ${keys.length} keys:`, keys)
	 *   }
	 * })
	 */
	findMissingKeys(): Record<string, string[]> {
		const missingKeys: Record<string, string[]> = {}

		// Initialize result object for all supported locales
		this._supportedLocales.forEach((locale) => {
			missingKeys[locale] = []
		})

		try {
			// Get all unique keys from all locales
			const allKeys = new Set<string>()

			// Collect all keys from all locales
			for (const locale of this._supportedLocales) {
				const localeData = this._localizations[locale]
				if (!localeData) continue

				// Get keys from merged localization if available
				if (localeData['__merged__']) {
					this.collectKeys(localeData['__merged__'], '', allKeys)
				} else {
					// Collect keys from individual files
					Object.values(localeData).forEach((fileData) => {
						this.collectKeys(fileData, '', allKeys)
					})
				}
			}

			// Check each locale for missing keys
			for (const locale of this._supportedLocales) {
				const localeData = this._localizations[locale]

				for (const key of allKeys) {
					// Check if key exists in merged localization
					if (localeData?.['__merged__']) {
						if (!this.hasKey(key, localeData['__merged__'])) {
							missingKeys[locale].push(key)
						}
					} else if (localeData) {
						// Check across all files for this locale
						let found = false
						for (const fileData of Object.values(localeData)) {
							if (this.hasKey(key, fileData)) {
								found = true
								break
							}
						}
						if (!found) {
							missingKeys[locale].push(key)
						}
					} else {
						// Locale has no data at all
						missingKeys[locale].push(key)
					}
				}

				// Sort keys for better readability
				missingKeys[locale].sort()
			}

			// Only return locales that have missing keys
			const result: Record<string, string[]> = {}
			for (const [locale, keys] of Object.entries(missingKeys)) {
				if (keys.length > 0) {
					result[locale] = keys
				}
			}

			if (this._showLogs) {
				console.debug({
					message: 'Missing keys analysis complete',
					totalKeys: allKeys.size,
					localesWithMissingKeys: Object.keys(result).length,
					details: result,
				})
			}

			return result
		} catch (error) {
			if (this._showLogs) {
				console.error({ message: 'Failed to find missing keys', error })
			}
			return {}
		}
	}

	/**
	 * Recursively collects all keys from a localization object.
	 * @param obj - The localization object to traverse
	 * @param prefix - The current key path prefix
	 * @param keys - Set to store all found keys
	 */
	private collectKeys(obj: Localization | string, prefix: string, keys: Set<string>): void {
		if (typeof obj === 'string') {
			if (prefix) {
				keys.add(prefix)
			}
			return
		}

		if (typeof obj === 'object' && obj !== null) {
			// Check if it's a pluralization object (has zero, one, two, other)
			if ('zero' in obj || 'one' in obj || 'two' in obj || 'other' in obj) {
				if (prefix) {
					keys.add(prefix)
				}
				return
			}

			// Recursively process nested objects
			for (const [key, value] of Object.entries(obj)) {
				const newPrefix = prefix ? `${prefix}.${key}` : key
				this.collectKeys(value, newPrefix, keys)
			}
		}
	}

	/**
	 * Checks if a key exists in a localization object.
	 * Supports both flat keys with dots and nested object navigation.
	 * @param key - The key to search for (e.g., "greeting.message")
	 * @param obj - The localization object to search in
	 * @returns True if the key exists, false otherwise
	 */
	private hasKey(key: string, obj: Localization): boolean {
		// Try flat key first
		if (key in obj) {
			return true
		}

		// Try nested navigation
		const keys = key.split('.')
		let current: Localization | string = obj

		for (const k of keys) {
			if (typeof current === 'object' && current !== null && k in current) {
				current = current[k]
			} else {
				return false
			}
		}

		return current !== undefined
	}
}
