import {
	clearLocalizationCache,
	cloneCatalog,
	combineCatalogs,
	hasOwn,
	initializeFileSystem,
	isNodeJS,
	loadCatalog,
	lookup,
	readLocalization,
	type Catalog,
} from './helpers'

import type { Config } from '#types/Config'
import type { Localization } from '#types/Localization'
import type { LocalizationData } from '#types/LocalizationData'
import type { LocalizedValue } from '#types/LocalizedValue'

export type { Config } from '#types/Config'

initializeFileSystem()

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
	 * Indicates whether getLocalizedValue should fall back to the configured fallbackLocale by default.
	 */
	protected _useFallbackLocale: boolean = false

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

	private _cacheTtl: number = 0
	private _inputLocalizations: Catalog = {}

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
		useFallbackLocale = false,
		showMissingIdentifierMessage = false,
		missingIdentifierMessage = 'Missing_Localization_Identifier',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		localesDir = isNodeJS() && typeof process.cwd === 'function' ? `${process.cwd()}/src/locales` : '',
		featuresDir = '',
		showLogs = false,
		localizations = {},
		preloadLocalizations = true,
		cacheTtl = 0,
	}: Config = {}) {
		this.configure({
			localesDir,
			featuresDir,
			supportedLocales,
			currentLocale,
			fallbackLocale,
			useFallbackLocale,
			showMissingIdentifierMessage,
			missingIdentifierMessage,
			rtlLocales,
			showLogs,
			localizations,
			preloadLocalizations,
			cacheTtl,
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
		return [...this._supportedLocales]
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
	 * Whether getLocalizedValue falls back to the configured fallbackLocale by default.
	 *
	 * @returns {boolean} True when fallback locale usage is enabled in config.
	 *
	 * @example
	 * const i18xs = new I18XS({ useFallbackLocale: true });
	 * const enabled = i18xs.useFallbackLocale; // true
	 */
	get useFallbackLocale(): boolean {
		return this._useFallbackLocale
	}

	/**
	 * Determines if the current locale is left-to-right (LTR).
	 * @returns {boolean} True if the current locale is LTR, false otherwise.
	 * @example
	 * const i18xs = new I18XS();
	 * i18xs.changeCurrentLocale('en');
	 * console.log(i18xs.isCurrentLocaleLTR); // Output: true
	 * i18xs.changeCurrentLocale('ar');
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
	 * i18xs.changeCurrentLocale('ar');
	 * console.log(i18xs.isCurrentLocaleRTL); // Output: true
	 * i18xs.changeCurrentLocale('en');
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
		useFallbackLocale = false,
		showMissingIdentifierMessage = false,
		missingIdentifierMessage = 'Missing_Localization_Identifier',
		rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'syr', 'dv', 'ug'],
		showLogs = false,
		localizations = {},
		preloadLocalizations = true,
		cacheTtl = 0,
	}: Config = {}): I18XS {
		if (typeof cacheTtl !== 'number' || Number.isNaN(cacheTtl) || cacheTtl < 0) {
			throw new RangeError('cacheTtl must be a non-negative number of seconds')
		}

		this._cacheTtl = cacheTtl
		this._localesDir = localesDir
		this._featuresDir = featuresDir
		this._supportedLocales = [...supportedLocales]
		this._currentLocale = currentLocale
		this._fallbackLocale = fallbackLocale
		this._useFallbackLocale = useFallbackLocale
		this._showMissingIdentifierMessage = showMissingIdentifierMessage
		this._missingIdentifierMessage = missingIdentifierMessage
		this._rtlLocales = [...rtlLocales]
		this._showLogs = showLogs
		this._inputLocalizations = cloneCatalog(localizations)
		this._localizations = combineCatalogs(this._inputLocalizations, {})
		this._preloadLocalizations = preloadLocalizations

		// Preload all localizations if enabled
		if (this._preloadLocalizations) {
			this.loadPreloadedLocalizations()
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

	/** Clears shared file/catalog caches. Existing instances retain their snapshots. */
	static clearCache(): void {
		clearLocalizationCache()
	}

	/** Reloads this instance from disk, including removed files and keys. */
	preloadAllLocalizations(): void {
		this.loadPreloadedLocalizations(true)
	}

	private loadPreloadedLocalizations(refresh = false): void {
		const disk = loadCatalog(
			{
				localesDir: this._localesDir,
				featuresDir: this._featuresDir,
				locales: [...new Set([...this._supportedLocales, this._fallbackLocale])],
				cacheTtl: this._cacheTtl,
				showLogs: this._showLogs,
			},
			refresh
		)
		this._localizations = combineCatalogs(this._inputLocalizations, disk)
	}

	private loadLocalization(fileName: string, locale: string): Localization | undefined {
		const files = this._localizations[locale]
		if (files && hasOwn(files, fileName)) return files[fileName]
		if (this._preloadLocalizations || !fileName || /[/\\]/.test(fileName)) return undefined
		if (!this._supportedLocales.includes(locale) && locale !== this._fallbackLocale) return undefined

		const traditional = this._localesDir
			? readLocalization(`${this._localesDir}/${locale}/${fileName}.json`, this._cacheTtl, this._showLogs)
			: undefined
		let localization = traditional
		if (!localization && this._featuresDir) {
			localization = readLocalization(
				`${this._featuresDir}/${fileName}/locales/${locale}.json`,
				this._cacheTtl,
				this._showLogs
			)
		}
		if (localization) {
			const localeFiles = this._localizations[locale] ?? (this._localizations[locale] = Object.create(null))
			localeFiles[fileName] = localization
		}
		return localization
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
		return this.resolveMessage(identifier) !== undefined
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
		return message.replace(/\{([^{}]*)\}/g, (placeholder, key: string) => {
			if (!hasOwn(data, key)) return placeholder
			const value = data[key]
			return value === null || value === undefined ? '' : String(value)
		})
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
		return lookup(identifier, localization) ?? lookup(keys.join('.'), localization)
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
		const message = this.resolveMessage(identifier)
		if (message === undefined)
			return this._showMissingIdentifierMessage ? this._missingIdentifierMessage : identifier
		return this.formatMessageValue(message, data)
	}

	private resolveMessage(identifier: string): string | Localization | undefined {
		if (!identifier) return undefined
		const { fileName, keys } = this.splitIdentifier(identifier)
		for (const locale of new Set([this._currentLocale, this._fallbackLocale])) {
			if (keys.length > 0) {
				const file = this.loadLocalization(fileName, locale)
				if (file) {
					const message = lookup(keys.join('.'), file) ?? lookup(identifier, file)
					if (message !== undefined) return message
				}
			}
			if (this._preloadLocalizations) {
				const merged = this._localizations[locale]?.__merged__
				const message = merged ? lookup(identifier, merged) : undefined
				if (message !== undefined) return message
			}
		}
		return undefined
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
				if (hasOwn(data, 'count') && typeof data.count === 'number') {
					count = data.count
				} else {
					count = Object.values(data).find((value): value is number => typeof value === 'number') ?? 0
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
			if (selectedForm === undefined) {
				selectedForm = message.other as string | undefined
			}

			// If still no form found, return error or empty
			if (typeof selectedForm !== 'string') {
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
	 * A valid pluralization object contains string-valued zero, one, two, or other forms.
	 * @param obj - The object to check
	 * @returns True if it's a valid pluralization object
	 */
	private isPluralizationObject(obj: Localization): boolean {
		if (typeof obj !== 'object' || obj === null) return false
		const forms = ['zero', 'one', 'two', 'other']
		const entries = Object.entries(obj)
		return entries.length > 0 && entries.every(([key, value]) => forms.includes(key) && typeof value === 'string')
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
	localizeValue(localeFile: string, value: null | undefined, data?: LocalizationData): null
	localizeValue(localeFile: string, value: string, data?: LocalizationData): LocalizedValue
	localizeValue(localeFile: string, value: string | null | undefined, data?: LocalizationData): LocalizedValue | null
	localizeValue(
		localeFile: string,
		value: string | null | undefined,
		data?: LocalizationData
	): LocalizedValue | null {
		if (value === null || value === undefined) return null

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
	 * @param options - Optional settings
	 * @param options.fallbackLocale - Explicit locale to use when the current locale value is missing or null
	 * @param options.useFallbackLocale - When true, falls back to the configured fallbackLocale.
	 *   Defaults to the `useFallbackLocale` value from config (false by default).
	 * @returns The string value for the current locale, a fallback locale if enabled, or null
	 *
	 * @example
	 * const name = { en: "Product", ar: "منتج" };
	 * const localizedName = i18n.getLocalizedValue(name); // Returns "Product" if currentLocale is "en"
	 *
	 * @example
	 * const name = { en: "Product" };
	 * // currentLocale is "ar" — falls back to English instead of null
	 * const localizedName = i18n.getLocalizedValue(name, { fallbackLocale: 'en' }); // "Product"
	 *
	 * @example
	 * // Uses the fallbackLocale from config (e.g. 'en') without passing it each time
	 * const localizedName = i18n.getLocalizedValue(name, { useFallbackLocale: true });
	 *
	 * @example
	 * // Or enable it globally in config so every call falls back automatically
	 * const i18n = new I18XS({ fallbackLocale: 'en', useFallbackLocale: true });
	 * const localizedName = i18n.getLocalizedValue(name); // falls back to 'en' when missing
	 */
	getLocalizedValue(
		localizedObject?: Record<string, string | null | undefined> | null,
		options?: { fallbackLocale?: string; useFallbackLocale?: boolean }
	): string | null {
		if (!localizedObject) return null

		const { fallbackLocale: explicitFallbackLocale, useFallbackLocale = this._useFallbackLocale } = options ?? {}
		const fallbackLocale = explicitFallbackLocale ?? (useFallbackLocale ? this._fallbackLocale : undefined)

		const currentValue = hasOwn(localizedObject, this.currentLocale)
			? localizedObject[this.currentLocale]
			: undefined
		const fallbackValue =
			fallbackLocale && hasOwn(localizedObject, fallbackLocale) ? localizedObject[fallbackLocale] : null
		return currentValue ?? fallbackValue ?? null
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
	 * <html dir={i18n.textDirection}>
	 *
	 * @example
	 * // Using in React
	 * function App() {
	 *   const direction = i18n.textDirection
	 *   return <div dir={direction}>Content</div>
	 * }
	 *
	 * @example
	 * // Conditional styling
	 * const marginStart = i18n.textDirection === 'rtl' ? 'marginRight' : 'marginLeft'
	 *
	 * @example
	 * i18n.changeCurrentLocale('en')
	 * i18n.textDirection // 'ltr'
	 *
	 * i18n.changeCurrentLocale('ar')
	 * i18n.textDirection // 'rtl'
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
			if (this.isPluralizationObject(obj)) {
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
		return lookup(key, obj) !== undefined
	}
}
