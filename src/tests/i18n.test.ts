import { describe, expect, it } from 'vitest'

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
