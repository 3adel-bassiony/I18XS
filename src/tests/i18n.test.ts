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
