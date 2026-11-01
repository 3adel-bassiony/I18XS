import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'

import I18XS from '..'

const directories: string[] = []

function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'i18xs-catalog-'))
	directories.push(root)
	const localesDir = join(root, 'locales')
	const featuresDir = join(root, 'features')
	const write = (locale: string, name: string, data: unknown, feature = false) => {
		const directory = feature ? join(featuresDir, name, 'locales') : join(localesDir, locale)
		mkdirSync(directory, { recursive: true })
		writeFileSync(join(directory, `${feature ? locale : name}.json`), JSON.stringify(data))
	}
	return { root, localesDir, featuresDir, write }
}

afterEach(() => {
	mock.restore()
	for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('Shared localization catalogs', () => {
	it('reuses a preloaded catalog across instances while isolating request locales', async () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Hello' })
		write('ar', 'common', { greeting: 'مرحبا' })
		const config = { localesDir, supportedLocales: ['en', 'ar'], cacheTtl: 300 }
		const english = new I18XS({ ...config, currentLocale: 'en' })
		renameSync(localesDir, `${localesDir}-offline`)
		const arabic = new I18XS({ ...config, currentLocale: 'ar' })
		expect(arabic.t('common.greeting')).toBe('مرحبا')
		const responses = await Promise.all(
			[english, arabic, english, arabic].map(async (i18n) => {
				await Promise.resolve()
				return i18n.t('common.greeting')
			})
		)
		expect(responses).toEqual(['Hello', 'مرحبا', 'Hello', 'مرحبا'])
		arabic.changeCurrentLocale('en')
		expect(english.currentLocale).toBe('en')
	})

	it('keeps catalogs from different roots separate', () => {
		const first = fixture()
		const second = fixture()
		first.write('en', 'common', { greeting: 'First' })
		second.write('en', 'common', { greeting: 'Second' })
		expect(new I18XS({ localesDir: first.localesDir, cacheTtl: 300 }).t('greeting')).toBe('First')
		expect(new I18XS({ localesDir: second.localesDir, cacheTtl: 300 }).t('greeting')).toBe('Second')
	})

	it('normalizes source paths before sharing catalogs', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Hello' })
		expect(new I18XS({ localesDir, cacheTtl: 300 }).t('greeting')).toBe('Hello')
		renameSync(localesDir, `${localesDir}-offline`)
		expect(new I18XS({ localesDir: `${localesDir}/../locales`, cacheTtl: 300 }).t('greeting')).toBe('Hello')
	})

	it('isolates caller-provided messages from shared disk catalogs and leaves input unchanged', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Disk' })
		const localizations = { en: { private: { greeting: 'Only first request' } } }
		const first = new I18XS({ localesDir, cacheTtl: 300, localizations })
		const second = new I18XS({ localesDir, cacheTtl: 300 })
		expect(first.t('private.greeting')).toBe('Only first request')
		expect(second.t('private.greeting')).toBe('private.greeting')
		expect(localizations).toEqual({ en: { private: { greeting: 'Only first request' } } })
	})

	it('respects the caller cache TTL and refreshes after expiry', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Before' })
		const clock = spyOn(Date, 'now').mockReturnValue(10_000)
		const config = { localesDir, cacheTtl: 10 }
		expect(new I18XS(config).t('greeting')).toBe('Before')
		write('en', 'common', { greeting: 'After' })
		clock.mockReturnValue(19_999)
		expect(new I18XS(config).t('greeting')).toBe('Before')
		clock.mockReturnValue(20_000)
		expect(new I18XS(config).t('greeting')).toBe('After')
	})

	it('allows shared caching to be disabled for development', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Before' })
		const original = new I18XS({ localesDir })
		write('en', 'common', { greeting: 'After' })
		expect(new I18XS({ localesDir, cacheTtl: 0 }).t('greeting')).toBe('After')
		expect(original.t('greeting')).toBe('Before')
	})

	it('clears shared cache without changing existing instance snapshots', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Before' })
		const config = { localesDir, cacheTtl: 300 }
		const original = new I18XS(config)
		write('en', 'common', { greeting: 'After' })
		I18XS.clearCache()
		expect(new I18XS(config).t('greeting')).toBe('After')
		expect(original.t('greeting')).toBe('Before')
	})

	it('reloads changed and deleted files without retaining removed keys', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { kept: 'Before', removed: 'Old' })
		write('en', 'obsolete', { oldFile: 'Old file' })
		const config = { localesDir, cacheTtl: 300 }
		const i18n = new I18XS(config)
		write('en', 'common', { kept: 'After' })
		rmSync(join(localesDir, 'en', 'obsolete.json'))
		i18n.preloadAllLocalizations()
		expect(i18n.t('kept')).toBe('After')
		expect(i18n.t('removed')).toBe('removed')
		expect(i18n.t('obsolete.oldFile')).toBe('obsolete.oldFile')
		expect(new I18XS(config).hasIdentifier('removed')).toBe(false)
	})

	it('invalidates cached locale selections for the same sources on an explicit reload', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Before' })
		const config = { localesDir, cacheTtl: 300 }
		const english = new I18XS({ ...config, supportedLocales: ['en'] })
		new I18XS({ ...config, supportedLocales: ['en', 'ar'] })
		write('en', 'common', { greeting: 'After' })
		english.preloadAllLocalizations()
		expect(new I18XS({ ...config, supportedLocales: ['en', 'ar'] }).t('greeting')).toBe('After')
	})

	it('rejects invalid cache lifetimes and keeps configuration arrays instance-local', () => {
		expect(() => new I18XS({ cacheTtl: -1 })).toThrow(RangeError)
		expect(() => new I18XS({ cacheTtl: Number.NaN })).toThrow(RangeError)
		const supportedLocales = ['en', 'ar']
		const i18n = new I18XS({ localesDir: '', supportedLocales })
		supportedLocales.push('fr')
		i18n.supportedLocales.push('de')
		expect(i18n.supportedLocales).toEqual(['en', 'ar'])
	})

	it('bounds shared catalogs and evicts the least recently used source', () => {
		I18XS.clearCache()
		const sources = Array.from({ length: 129 }, (_, index) => {
			const source = fixture()
			source.write('en', 'common', { greeting: `Catalog ${index}` })
			return source
		})
		const read = (index: number) =>
			new I18XS({ localesDir: sources[index].localesDir, cacheTtl: 300 }).t('greeting')
		for (let index = 0; index < 128; index++) read(index)
		expect(read(0)).toBe('Catalog 0')
		read(128)
		renameSync(sources[0].localesDir, `${sources[0].localesDir}-offline`)
		renameSync(sources[1].localesDir, `${sources[1].localesDir}-offline`)
		expect(read(0)).toBe('Catalog 0')
		expect(read(1)).toBe('greeting')
	})

	it('shares lazy file reads without letting a cached fallback replace the requested locale', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Hello' })
		write('ar', 'common', { greeting: 'مرحبا' })
		const config = { localesDir, supportedLocales: ['en', 'ar'], preloadLocalizations: false, cacheTtl: 300 }
		const i18n = new I18XS({ ...config, currentLocale: 'fr' })
		expect(i18n.t('common.greeting')).toBe('Hello')
		i18n.changeCurrentLocale('ar')
		expect(i18n.t('common.greeting')).toBe('مرحبا')
		renameSync(localesDir, `${localesDir}-offline`)
		expect(new I18XS({ ...config, currentLocale: 'ar' }).t('common.greeting')).toBe('مرحبا')
	})
})

describe('Translation resolution', () => {
	it('falls back per missing key, including when fallback is outside supportedLocales', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { onlyEnglish: 'Fallback', greeting: 'Hello' })
		write('ar', 'common', { greeting: 'مرحبا' })
		for (const preloadLocalizations of [true, false]) {
			const i18n = new I18XS({
				localesDir,
				currentLocale: 'ar',
				supportedLocales: ['ar'],
				fallbackLocale: 'en',
				preloadLocalizations,
			})
			expect(i18n.t('common.onlyEnglish')).toBe('Fallback')
			expect(i18n.t('common.greeting')).toBe('مرحبا')
		}
	})

	it('uses the requested feature locale before the traditional fallback locale', () => {
		const { localesDir, featuresDir, write } = fixture()
		write('en', 'common', { greeting: 'English traditional' })
		write('ar', 'common', { greeting: 'Arabic feature' }, true)
		const i18n = new I18XS({
			localesDir,
			featuresDir,
			currentLocale: 'ar',
			supportedLocales: ['en', 'ar'],
			preloadLocalizations: false,
		})
		expect(i18n.t('common.greeting')).toBe('Arabic feature')
	})

	it('resolves a file prefix before merged keys from another file', () => {
		const { localesDir, write } = fixture()
		write('en', 'a', { title: 'A' })
		write('en', 'z', { title: 'Z' })
		const i18n = new I18XS({ localesDir })
		expect(i18n.t('a.title')).toBe('A')
		expect(i18n.t('z.title')).toBe('Z')
		expect(i18n.t('title')).toBe('Z')
		expect(i18n.t('unknown.title')).toBe('unknown.title')
	})

	it('keeps hasIdentifier consistent with namespaced and empty translations', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { Namespace: { active: 'Active' }, empty: '' })
		const i18n = new I18XS({ localesDir })
		expect(i18n.t('Namespace.active')).toBe('Active')
		expect(i18n.hasIdentifier('Namespace.active')).toBe(true)
		expect(i18n.t('common.empty')).toBe('')
		expect(i18n.hasIdentifier('common.empty')).toBe(true)
	})

	it('merges nested namespaces from multiple files without losing sibling translations', () => {
		const { localesDir, write } = fixture()
		write('en', 'a', { Shared: { first: 'First', overwritten: 'Before' } })
		write('en', 'z', { Shared: { second: 'Second', overwritten: 'After' } })
		const i18n = new I18XS({ localesDir })
		expect(i18n.t('Shared.first')).toBe('First')
		expect(i18n.t('Shared.second')).toBe('Second')
		expect(i18n.t('Shared.overwritten')).toBe('After')
	})

	it('rejects partial paths and inherited properties while supporting nested dotted keys', () => {
		const i18n = new I18XS({
			localesDir: '',
			localizations: { en: { common: { title: 'Title', Nested: { 'a.b': 'Dotted' } } } },
		})
		expect(i18n.t('common.title.extra')).toBe('common.title.extra')
		expect(i18n.t('common.constructor.name')).toBe('common.constructor.name')
		expect(i18n.t('common.Nested.a.b')).toBe('Dotted')
		expect(i18n.hasIdentifier('common.toString')).toBe(false)
	})

	it('ignores malformed localization roots without crashing translations', () => {
		const { localesDir, write } = fixture()
		write('en', 'a', null)
		write('en', 'b', [])
		write('en', 'c', { title: 'Valid' })
		const i18n = new I18XS({ localesDir })
		expect(i18n.t('title')).toBe('Valid')
		expect(i18n.t('unknown.key')).toBe('unknown.key')
	})

	it('recovers a malformed JSON file on explicit reload while retaining valid files', () => {
		const { localesDir, write } = fixture()
		write('en', 'common', { greeting: 'Hello' })
		writeFileSync(join(localesDir, 'en', 'broken.json'), '{invalid')
		const i18n = new I18XS({ localesDir, cacheTtl: 300 })
		expect(i18n.t('common.greeting')).toBe('Hello')
		expect(i18n.hasIdentifier('broken.title')).toBe(false)
		write('en', 'broken', { title: 'Repaired' })
		i18n.preloadAllLocalizations()
		expect(i18n.t('broken.title')).toBe('Repaired')
	})

	it('supports default construction and literal placeholder values', () => {
		const i18n = new I18XS()
		expect(i18n.replaceData('Paid {amount}', { amount: '$&' })).toBe('Paid $&')
		expect(i18n.replaceData('{a.b} {axb}', { 'a.b': '$1' })).toBe('$1 {axb}')
		expect(i18n.replaceData('{name} {other}', { name: '{other}', other: 'value' })).toBe('{other} value')
	})

	it('handles undefined localized values and ignores inherited locale properties', () => {
		const i18n = new I18XS({ currentLocale: 'ar', fallbackLocale: 'en', useFallbackLocale: true, localesDir: '' })
		expect(i18n.getLocalizedValue({ en: 'Fallback', ar: undefined })).toBe('Fallback')
		i18n.configure({ currentLocale: 'constructor', fallbackLocale: 'en', useFallbackLocale: true, localesDir: '' })
		expect(i18n.getLocalizedValue({ en: 'Fallback' })).toBe('Fallback')
	})

	it('supports direct and file-prefixed searches and finds a numeric plural parameter after text', () => {
		const i18n = new I18XS({
			localesDir: '',
			localizations: { en: { common: { items: { zero: 'Zero items', other: '{name}: {amount}' } } } },
		})
		expect(i18n.searchForLocalization('Nested.title', { Nested: { title: 'Title' } })).toBe('Title')
		expect(i18n.searchForLocalization('common.title', { title: 'Title' })).toBe('Title')
		expect(i18n.t('common.items', { name: 'Items', amount: 5 })).toBe('Items: 5')
	})
})
