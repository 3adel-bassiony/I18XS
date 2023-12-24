import { describe, expect, test } from 'vitest'

import I18XS from '..'

describe('I18XS', () => {
	test('It should create a new instance for I18XS', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs).toBeInstanceOf(I18XS)
	})

	test('It should configure the I18XS instance', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Hello_World: 'Hello World' },
		})
		expect(i18xs.currentLocale).toBe('en')
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
		expect(i18xs.localization).toEqual({ Hello_World: 'Hello World' })
	})

	test('It should get the fallback locale', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.fallbackLocale).toBe('en')
	})

	test('It should get the current locale', async () => {
		const i18xs = new I18XS({ currentLocale: 'ar', supportedLocales: ['en', 'ar'] })
		expect(i18xs.currentLocale).toBe('ar')
	})

	test('It should get the supported locales', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
	})

	test('It should change the current locale', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		i18xs.changeCurrentLocale('ar')
		expect(i18xs.currentLocale).toBe('ar')
	})

	test('It should check if a locale is supported', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocale('ar')).toBe(true)
	})

	test('It should check if a locale is not supported', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isCurrentLocale('fr')).toBe(false)
	})

	test('It should check if the key exists in the translation object', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Hello_World: 'Hello World' },
		})
		expect(i18xs.hasIdentifier('Hello_World')).toBe(false)
	})

	test('It should format the message using formatMessage function and identifier', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Hello_World: 'Hello World' },
		})
		expect(i18xs.formatMessage('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Hello_World: 'Hello World' },
		})
		expect(i18xs.t('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier with data', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Welcome_Message: 'Welcome {name}' },
		})
		expect(i18xs.t('Welcome_Message', { name: 'John Doe' })).toBe('Welcome John Doe')
	})

	test('It should search for the key in the localization', async () => {
		const i18xs = new I18XS({
			currentLocale: 'en',
			supportedLocales: ['en', 'ar'],
			localization: { Hello_World: 'Hello World' },
		})
		expect(i18xs.searchForLocalization('Hello_World')).toStrictEqual({ Hello_World: 'Hello World' })
	})

	test('It should load the localization from the locales directory', async () => {
		const dir = `${process.cwd()}/src/tests/data/locales`
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'], localesDir: dir })

		expect(i18xs.localization).toStrictEqual({
			common: {
				Success: 'Success',
				Failed: 'Failed',
			},
			validation: {
				string: {
					required: 'This field is required',
				},
			},
			Hello_World: 'Hello World',
			Welcome_Message: 'Welcome {name}',
		})
	})

	test('It should return a fallback message if the key not found', async () => {
		const dir = `${process.cwd()}/src/tests/data/locales`
		const i18xs = new I18XS({ currentLocale: 'en', localesDir: dir })

		expect(i18xs.t('Key_Not_Exist')).toBe('This identifier does not exist')
	})

	test('It should check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({ currentLocale: 'en', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isLTR).toBe(true)
	})

	test('It should check if the current locale is RTL or not', async () => {
		const i18xs = new I18XS({ currentLocale: 'ar', supportedLocales: ['en', 'ar'] })
		expect(i18xs.isRTL).toBe(true)
	})

	test('It should customize rtlLocales and check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({ currentLocale: 'he', supportedLocales: ['en', 'ar'], rtlLocales: ['ar'] })
		expect(i18xs.isRTL).toBe(false)
	})

	// test('It should enable debug mode', async () => {
	// 	const i18xs = new I18XS({ currentLocale: 'he', supportedLocales: ['en', 'ar'], enableDebug: true })
	// 	expect(i18xs.isDebugEnabled).toBe(true)
	// 	i18xs.changeCurrentLocale('ar')
	// 	const consoleSpy = vi.spyOn(console, 'debug')
	// 	expect(consoleSpy).toHaveBeenCalledWith('Changed current locale to ar')
	// 	consoleSpy.mockRestore()
	// })
})
