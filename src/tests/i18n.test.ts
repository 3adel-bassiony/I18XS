import { describe, expect, test } from 'vitest'

import I18XS from '..'

describe('I18XS', () => {
	test('It should create a new instance for I18XS', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs).toBeInstanceOf(I18XS)
	})

	test('It should configure the I18XS instance', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18xs.currentLocale).toBe('en')
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
		expect(i18xs.translations).toEqual({ Hello_World: 'Hello World' })
	})

	test('It should get the default locale', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs.defaultLocale).toBe('en')
	})

	test('It should get the current locale', async () => {
		const i18xs = new I18XS({ locale: 'ar', locales: ['en', 'ar'] })
		expect(i18xs.currentLocale).toBe('ar')
	})

	test('It should get the supported locales', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs.supportedLocales).toEqual(['en', 'ar'])
	})

	test('It should change the current locale', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		i18xs.changeLocale('ar')
		expect(i18xs.currentLocale).toBe('ar')
	})

	test('It should check if a locale is supported', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs.isLocale('ar')).toBe(true)
	})

	test('It should check if a locale is not supported', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs.isLocale('fr')).toBe(false)
	})

	test('It should check if the key exists in the translation object', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18xs.hasKey('Hello_World')).toBe(false)
	})

	test('It should format the message using formatMessage function and identifier', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18xs.formatMessage('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18xs.t('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier with data', async () => {
		const i18xs = new I18XS({
			locale: 'en',
			locales: ['en', 'ar'],
			translations: { Welcome_Message: 'Welcome {name}' },
		})
		expect(i18xs.t('Welcome_Message', { name: 'John Doe' })).toBe('Welcome John Doe')
	})

	test('It should search for the key in the translations', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18xs.searchForTranslations('Hello_World')).toStrictEqual({ Hello_World: 'Hello World' })
	})

	test('It should load the translations from the locales directory', async () => {
		const dir = `${process.cwd()}/src/tests/data/locales`
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'], localesDir: dir })

		expect(i18xs.translations).toStrictEqual({
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
		const i18xs = new I18XS({ locale: 'en', localesDir: dir })

		expect(i18xs.t('Key_Not_Exist')).toBe('This identifier does not exist')
	})

	test('It should check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18xs.isLTR).toBe(true)
	})

	test('It should check if the current locale is RTL or not', async () => {
		const i18xs = new I18XS({ locale: 'ar', locales: ['en', 'ar'] })
		expect(i18xs.isRTL).toBe(true)
	})

	test('It should customize rtlLocales and check if the current locale is LTR or not', async () => {
		const i18xs = new I18XS({ locale: 'he', locales: ['en', 'ar'], rtlLocales: ['ar'] })
		expect(i18xs.isRTL).toBe(false)
	})
})
