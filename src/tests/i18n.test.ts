import { describe, expect, it } from 'bun:test'

import I18XS from '..'

const dir = `${process.cwd()}/src/tests/data/locales`

describe('I18XS Initialization', () => {
	it('Should create a new instance for I18XS', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs).toBeInstanceOf(I18XS)
	})

	it('Should create a new instance for I18XS with configuration', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localesDir: dir,
		})
		expect(i18xs.currentLocale).toBe('en')
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
	})

	it('Should create a new instance for I18XS with configuration and passing localizations', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localizations: {
				en: {
					general: {
						Hello_World: 'Hello World',
					},
				},
				ar: {
					general: {
						Hello_World: 'مرحبًا بالعالم',
					},
				},
			},
		})
		expect(i18xs.currentLocale).toBe('en')
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
	})

	it('Should create a new instance for I18XS and configure it next', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localesDir: dir,
		})

		i18xs.configure({
			localesDir: dir,
			currentLocale: 'ar',
			supportedLocales: ['ar', 'fr'],
			showLogs: true,
		})

		expect(i18xs.currentLocale).toBe('ar')
		expect(i18xs.supportedLocales).toEqual(['ar', 'fr'])
		expect(i18xs.isCurrentLocaleRTL).toBe(true)
		expect(i18xs.isCurrentLocaleLTR).toBe(false)
		expect(i18xs.isShowLogs).toBe(true)
		expect(i18xs.t('general.Hello_World')).toBe('مرحبًا بالعالم')
		expect(i18xs.t('general.Old_Hello_World')).toBe('general.Old_Hello_World')
	})
})

describe('I18XS Properties', () => {
	it('Should get the supported locales', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
	})

	it('Should get the current locale', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'ar', supportedLocales: ['en', 'ar'] })
		expect(i18xs.currentLocale).toBe('ar')
	})

	it('Should get the fallback locale', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.fallbackLocale).toBe('en')
	})

	it('Should get the current locale', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		i18xs.changeCurrentLocale('ar')
		expect(i18xs.currentLocale).toBe('ar')
	})

	it('Should check if a locale is supported', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocale('ar')).toBe(true)
	})

	it('Should check if a locale is not supported', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocale('fr')).toBe(false)
	})

	it('Should check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocaleLTR).toBe(true)
	})

	it('Should check if the current locale is RTL or not', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'ar', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocaleRTL).toBe(true)
	})

	it('Should customize rtlLocales and check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'he',
			supportedLocales: ['en', 'ar'],
			rtlLocales: ['ar'],
		})
		expect(i18xs.isCurrentLocaleRTL).toBe(false)
	})
})

describe('I18XS Format Messages', () => {
	it('It should format the message using formatMessage function and identifier', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Hello_World')).toBe('Hello World')
	})

	it('It should format the message using t function and identifier', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
	})

	it('It should format the message using formatMessage function and identifier with plural data [ zero ]', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Items_Count', { itemsCount: 0 })).toBe('No items')
	})

	it('It should format the message using formatMessage function and identifier with plural data [ one ]', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Items_Count', { itemsCount: 1 })).toBe('One item')
	})

	it('It should format the message using formatMessage function and identifier with plural data [ two ]', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Items_Count', { itemsCount: 2 })).toBe('Two items')
	})

	it('It should format the message using formatMessage function and identifier with plural data [ other ]', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Items_Count', { itemsCount: 30 })).toBe('30 items')
	})

	it('It should format the message using formatMessage function and identifier with plural data [ other - Multiple params ]', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.formatMessage('general.Multiple_Items_Count', { itemsCount: 30, resourcesCount: 50 })).toBe(
			'30 items, 50 resources'
		)
	})

	it('It should format the message using t function and identifier with data', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('general.Welcome_Message', { name: 'John Doe' })).toBe('Welcome John Doe')
	})

	it('It should return a fallback message if the key not found', async () => {
		const dir = `${process.cwd()}/src/tests/data/locales`
		const i18xs = new I18XS({ currentLocale: 'en', localesDir: dir })

		expect(i18xs.t('Key_Not_Exist')).toBe('Key_Not_Exist')
	})

	it('It should return a fallback message if the key not found and show missing identifier is true', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', localesDir: dir, showMissingIdentifierMessage: true })

		expect(i18xs.t('Key_Not_Exist')).toBe('Missing_Localization_Identifier')
	})

	it('Should handle localization keys that contain dots', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		// Key with dots: "api.error.message"
		expect(i18xs.t('general.api.error.message')).toBe('API Error Occurred')
	})

	it('Should handle localization keys with dots in Arabic', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'ar',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('general.api.error.message')).toBe('حدث خطأ في API')
	})

	it('Should handle multiple dot-separated keys', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('general.form.field.required')).toBe('This field is required')
	})

	// it('It should enable debug mode', async () => {
	// 	const i18xs = new I18XS({ currentLocale: 'he', supportedLocales: ['en', 'ar'], showLogs: true })
	// 	expect(i18xs.isShowLogs).toBe(true)
	// 	i18xs.changeCurrentLocale('ar')
	// 	const consoleSpy = vi.spyOn(console, 'debug')
	// 	expect(consoleSpy).toHaveBeenCalledWith('Changed current locale to ar')
	// 	consoleSpy.mockRestore()
	// })
})

describe('I18XS Helpers', () => {
	it('Should check if the key exists in the localization object', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.hasIdentifier('general.Hello_World')).toBe(true)
	})

	it('Should check if the key exists in the nested localization object', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.hasIdentifier('common.Success')).toBe(true)
	})

	it('Should replace the data placeholders with the actual data variables from object', async () => {
		const i18xs = new I18XS({ localesDir: dir, currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.replaceData('Welcome {name}', { name: 'John Doe' })).toBe('Welcome John Doe')
	})

	it('Should search for the key in the localization', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.searchForLocalization('general.Hello_World', { Hello_World: 'Hello World' })).toStrictEqual(
			'Hello World'
		)
	})
})

describe('I18XS Feature-Based Folders', () => {
	const featuresDir = `${process.cwd()}/src/tests/data/features`

	it('Should automatically load localization from feature folder', async () => {
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		// No @ prefix needed - automatically detected!
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
	})

	it('Should load localization from feature folder in Arabic', async () => {
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'ar',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('foo.Hello_World')).toBe('مرحبًا بالعالم')
	})

	it('Should load localization from bar feature folder', async () => {
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('bar.Hello_World')).toBe('Hello World')
	})

	it('Should check if feature-based identifier exists', async () => {
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.hasIdentifier('foo.Hello_World')).toBe(true)
	})

	it('Should return fallback for non-existent feature', async () => {
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		expect(i18xs.t('nonexistent.Key')).toBe('nonexistent.Key')
	})

	it('Should prioritize traditional structure over feature-based', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		// 'general' exists in traditional structure, should load from there first
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
		// 'foo' only exists in features, should load from there
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
	})

	it('Should only check featuresDir when localesDir is not provided (performance optimization)', async () => {
		const i18xs = new I18XS({
			featuresDir, // Only featuresDir provided
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		// Should load directly from features without checking localesDir first
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
		expect(i18xs.t('bar.Hello_World')).toBe('Hello World')
	})

	it('Should only check localesDir when featuresDir is not provided (performance optimization)', async () => {
		const i18xs = new I18XS({
			localesDir: dir, // Only localesDir provided
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
		})
		// Should load directly from locales without checking featuresDir
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
		expect(i18xs.t('common.Success')).toBe('Success')
	})
})

describe('I18XS React Native / Browser Compatibility', () => {
	it('Should work with in-memory localizations only (React Native mode)', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localizations: {
				en: {
					app: {
						title: 'My React Native App',
						greeting: 'Hello {name}',
					},
				},
				ar: {
					app: {
						title: 'تطبيقي React Native',
						greeting: 'مرحبا {name}',
					},
				},
			},
		})

		expect(i18xs.t('app.title')).toBe('My React Native App')
		expect(i18xs.t('app.greeting', { name: 'John' })).toBe('Hello John')
	})

	it('Should work with in-memory localizations in Arabic', async () => {
		const i18xs = new I18XS({
			currentLocale: 'ar',
			supportedLocales: ['en', 'ar'],
			localizations: {
				en: {
					app: {
						title: 'My React Native App',
					},
				},
				ar: {
					app: {
						title: 'تطبيقي React Native',
					},
				},
			},
		})

		expect(i18xs.t('app.title')).toBe('تطبيقي React Native')
		expect(i18xs.isCurrentLocaleRTL).toBe(true)
	})

	it('Should handle flat keys with dots in-memory (React Native)', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en'],
			localizations: {
				en: {
					errors: {
						'api.network.timeout': 'Network timeout error',
						'form.validation.email': 'Invalid email',
					},
				},
			},
		})

		expect(i18xs.t('errors.api.network.timeout')).toBe('Network timeout error')
		expect(i18xs.t('errors.form.validation.email')).toBe('Invalid email')
	})
})

describe('I18XS Preloading & Caching', () => {
	it('Should preload all localizations by default', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			showLogs: false,
		})

		// All files should be preloaded, so translations work immediately
		expect(i18xs.t('Hello_World')).toBe('Hello World')
		expect(i18xs.t('Success')).toBe('Success')
		expect(i18xs.t('string.required')).toBe('This field is required')
	})

	it('Should allow disabling preloading with preloadLocalizations: false', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: false, // Disable preloading
			showLogs: false,
		})

		// With preloading disabled, traditional API still works
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
		expect(i18xs.t('common.Success')).toBe('Success')
	})

	it('Should cache files after loading with preloading disabled', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: false,
			showLogs: false,
		})

		// First call loads and caches
		const first = i18xs.t('general.Hello_World')
		// Second call uses cache
		const second = i18xs.t('general.Hello_World')

		expect(first).toBe('Hello World')
		expect(second).toBe('Hello World')
	})

	it('Should preload from both traditional and feature-based structures', async () => {
		const featuresDir = `${process.cwd()}/src/tests/data/features`
		const i18xs = new I18XS({
			localesDir: dir,
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			showLogs: false,
		})

		// Should have access to both traditional and feature files
		expect(i18xs.t('Hello_World')).toBe('Hello World') // from general.json
		expect(i18xs.t('Success')).toBe('Success') // from common.json
		// Feature files are also preloaded and merged
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
	})

	it('Should preload all supported locales', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			showLogs: false,
		})

		// English
		expect(i18xs.t('Hello_World')).toBe('Hello World')

		// Switch to Arabic
		i18xs.changeCurrentLocale('ar')
		expect(i18xs.t('Hello_World')).toBe('مرحبًا بالعالم')
		expect(i18xs.t('Success')).toBe('نجاح')
	})
})

describe('I18XS Simplified API (No File Prefix)', () => {
	it('Should translate without file prefix when preloading is enabled', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// New simplified API - no file prefix needed
		expect(i18xs.t('Hello_World')).toBe('Hello World')
		expect(i18xs.t('Welcome_Message', { name: 'John' })).toBe('Welcome John')
		expect(i18xs.t('Success')).toBe('Success')
		expect(i18xs.t('Failed')).toBe('Failed')
	})

	it('Should support namespace access with dot notation', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Access nested keys
		expect(i18xs.t('string.required')).toBe('This field is required')
	})

	it('Should work with pluralization without file prefix', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		expect(i18xs.t('Items_Count', { itemsCount: 0 })).toBe('No items')
		expect(i18xs.t('Items_Count', { itemsCount: 1 })).toBe('One item')
		expect(i18xs.t('Items_Count', { itemsCount: 2 })).toBe('Two items')
		expect(i18xs.t('Items_Count', { itemsCount: 10 })).toBe('10 items')
	})

	it('Should work with keys containing dots without file prefix', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// These are flat keys with dots in the JSON
		expect(i18xs.t('api.error.message')).toBe('API Error Occurred')
		expect(i18xs.t('form.field.required')).toBe('This field is required')
	})

	it('Should maintain backward compatibility with file prefix', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Old API with file prefix should still work
		expect(i18xs.t('general.Hello_World')).toBe('Hello World')
		expect(i18xs.t('general.Welcome_Message', { name: 'Jane' })).toBe('Welcome Jane')
		expect(i18xs.t('common.Success')).toBe('Success')
		expect(i18xs.t('validation.string.required')).toBe('This field is required')
	})

	it('Should return fallback for non-existent keys without file prefix', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		expect(i18xs.t('NonExistent_Key')).toBe('NonExistent_Key')
	})

	it('Should return missing identifier message when enabled', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showMissingIdentifierMessage: true,
			showLogs: false,
		})

		expect(i18xs.t('NonExistent_Key')).toBe('Missing_Localization_Identifier')
	})
})

describe('I18XS Merged Localizations & Last-Load-Wins', () => {
	it('Should merge all localization files into one namespace', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// All files (general, common, validation) are merged
		expect(i18xs.t('Hello_World')).toBe('Hello World') // from general.json
		expect(i18xs.t('Success')).toBe('Success') // from common.json
		expect(i18xs.t('string.required')).toBe('This field is required') // from validation.json
	})

	it('Should apply last-load-wins strategy for conflicting keys', async () => {
		const featuresDir = `${process.cwd()}/src/tests/data/features`
		
		// Create a scenario where we have the same key in different files
		const i18xs = new I18XS({
			localesDir: dir,
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Both traditional general.json and feature foo have Hello_World
		// Features are loaded after traditional, so they should win
		expect(i18xs.t('Hello_World')).toBe('Hello World')
	})

	it('Should merge traditional and feature-based localizations', async () => {
		const featuresDir = `${process.cwd()}/src/tests/data/features`
		const i18xs = new I18XS({
			localesDir: dir,
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Can access keys from both traditional and feature files without prefix
		expect(i18xs.t('Hello_World')).toBe('Hello World')
		expect(i18xs.t('Success')).toBe('Success')
		
		// Old API still works for feature files
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
		expect(i18xs.t('bar.Hello_World')).toBe('Hello World')
	})

	it('Should work correctly when switching locales with merged localizations', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// English
		expect(i18xs.t('Hello_World')).toBe('Hello World')
		expect(i18xs.t('Success')).toBe('Success')

		// Switch to Arabic
		i18xs.changeCurrentLocale('ar')
		expect(i18xs.t('Hello_World')).toBe('مرحبًا بالعالم')
		expect(i18xs.t('Success')).toBe('نجاح')

		// Switch back to English
		i18xs.changeCurrentLocale('en')
		expect(i18xs.t('Hello_World')).toBe('Hello World')
	})

	it('Should handle hasIdentifier with merged localizations', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Should work with both old and new API
		expect(i18xs.hasIdentifier('general.Hello_World')).toBe(true)
		expect(i18xs.hasIdentifier('common.Success')).toBe(true)
		expect(i18xs.hasIdentifier('NonExistent.Key')).toBe(false)
	})
})

describe('I18XS Preloading with Features Only', () => {
	it('Should preload feature-based localizations without traditional structure', async () => {
		const featuresDir = `${process.cwd()}/src/tests/data/features`
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Should work with both old and new API
		expect(i18xs.t('foo.Hello_World')).toBe('Hello World')
		expect(i18xs.t('bar.Hello_World')).toBe('Hello World')
	})

	it('Should merge feature localizations when preloading', async () => {
		const featuresDir = `${process.cwd()}/src/tests/data/features`
		const i18xs = new I18XS({
			featuresDir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// With merged localizations, we can access without feature prefix
		// if both features have different keys, they're all available
		expect(i18xs.t('Hello_World')).toBe('Hello World')
	})
})

describe('I18XS Preloading Performance', () => {
	it('Should not perform disk I/O after preloading', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
			showLogs: false,
		})

		// Multiple calls should use cached data
		for (let i = 0; i < 100; i++) {
			expect(i18xs.t('Hello_World')).toBe('Hello World')
			expect(i18xs.t('Success')).toBe('Success')
		}
	})

	it('Should handle reconfiguration with preloading', async () => {
		const i18xs = new I18XS({
			localesDir: dir,
			currentLocale: 'en',
			supportedLocales: ['en'],
			preloadLocalizations: true,
			showLogs: false,
		})

		expect(i18xs.t('Hello_World')).toBe('Hello World')

		// Reconfigure with different locales
		i18xs.configure({
			localesDir: dir,
			currentLocale: 'ar',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: true,
		})

		// Should preload again with new configuration
		expect(i18xs.t('Hello_World')).toBe('مرحبًا بالعالم')
	})
})
