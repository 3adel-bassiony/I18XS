import { describe, expect, test } from 'vitest'

import I18T from '..'

describe('I18T', () => {
	test('It should create a new instance for I18T', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18t).toBeInstanceOf(I18T)
	})

	test('It should configure the I18T instance', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18t.currentLocale).toBe('en')
		expect(i18t.supportedLocales).toEqual(['en', 'ar'])
		expect(i18t.translations).toEqual({ Hello_World: 'Hello World' })
	})

	test('It should get the default locale', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18t.defaultLocale).toBe('en')
	})

	test('It should get the current locale', async () => {
		const i18t = new I18T({ locale: 'ar', locales: ['en', 'ar'] })
		expect(i18t.currentLocale).toBe('ar')
	})

	test('It should get the supported locales', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18t.supportedLocales).toEqual(['en', 'ar'])
	})

	test('It should change the current locale', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		i18t.changeLocale('ar')
		expect(i18t.currentLocale).toBe('ar')
	})

	test('It should check if a locale is supported', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18t.isLocale('ar')).toBe(true)
	})

	test('It should check if a locale is not supported', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'] })
		expect(i18t.isLocale('fr')).toBe(false)
	})

	test('It should check if the key exists in the translation object', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18t.hasKey('Hello_World')).toBe(false)
	})

	test('It should format the message using formatMessage function and identifier', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18t.formatMessage('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18t.t('Hello_World')).toBe('Hello World')
	})

	test('It should format the message using t function and identifier with data', async () => {
		const i18t = new I18T({
			locale: 'en',
			locales: ['en', 'ar'],
			translations: { Welcome_Message: 'Welcome {name}' },
		})
		expect(i18t.t('Welcome_Message', { name: 'John Doe' })).toBe('Welcome John Doe')
	})

	test('It should search for the key in the translations', async () => {
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], translations: { Hello_World: 'Hello World' } })
		expect(i18t.searchForTranslations('Hello_World')).toStrictEqual({ Hello_World: 'Hello World' })
	})

	test('It should load the translations from the locales directory', async () => {
		const dir = `${process.cwd()}/src/tests/data/locales`
		const i18t = new I18T({ locale: 'en', locales: ['en', 'ar'], localesDir: dir })

		expect(i18t.translations).toStrictEqual({
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
		const i18t = new I18T({ locale: 'en', localesDir: dir })

		expect(i18t.t('Key_Not_Exist')).toBe('This identifier does not exist')
	})
})
