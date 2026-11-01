import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'

const packageRoot = process.cwd()
const consumer = mkdtempSync(join(tmpdir(), 'i18xs-consumer-'))

function run(command: string, args: string[], cwd = consumer) {
	return spawnSync(command, args, { cwd, encoding: 'utf8' })
}

beforeAll(() => {
	const build = run(process.execPath, ['run', 'build'], packageRoot)
	if (build.status !== 0) throw new Error(build.stderr || build.stdout)
	const installedPackage = join(consumer, 'node_modules', 'i18xs')
	mkdirSync(installedPackage, { recursive: true })
	cpSync(join(packageRoot, 'build'), join(installedPackage, 'build'), { recursive: true })
	cpSync(join(packageRoot, 'package.json'), join(installedPackage, 'package.json'))
	writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }))
	writeFileSync(
		join(consumer, 'node.mjs'),
		`
import I18XS from 'i18xs'
const localesDir = ${JSON.stringify(join(packageRoot, 'src/tests/data/locales'))}
const en = new I18XS({localesDir, supportedLocales:['en','ar'], currentLocale:'en', cacheTtl:300})
const ar = new I18XS({localesDir, supportedLocales:['en','ar'], currentLocale:'ar', cacheTtl:300})
if (en.t('general.Hello_World') !== 'Hello World') throw new Error('English disk localization failed')
if (ar.t('general.Hello_World') !== 'مرحبًا بالعالم') throw new Error('Arabic disk localization failed')
`
	)
}, 30_000)

afterAll(() => {
	rmSync(consumer, { recursive: true, force: true })
})

async function bundlePortableConsumer(): Promise<string> {
	writeFileSync(
		join(consumer, 'browser.js'),
		`
import I18XS from 'i18xs'
const input = {en:{common:{greeting:'Hello', Namespace:{active:'Active'}}}, ar:{common:{greeting:'مرحبا'}}}
const en = new I18XS({localizations:input, currentLocale:'en', supportedLocales:['en','ar']})
const ar = new I18XS({localizations:input, currentLocale:'ar', supportedLocales:['en','ar'], useFallbackLocale:true})
export const result = [en.t('common.greeting'), ar.t('common.greeting'), en.hasIdentifier('Namespace.active'), ar.getLocalizedValue({en:'Fallback',ar:undefined})]
`
	)
	const bundled = await Bun.build({ entrypoints: [join(consumer, 'browser.js')], target: 'browser', format: 'cjs' })
	if (!bundled.success) throw new Error(bundled.logs.map((log) => log.message).join('\n'))
	return bundled.outputs[0].text()
}

function evaluatePortableConsumer(code: string, globals: Record<string, unknown> = {}): unknown[] {
	const module = { exports: {} as { result: unknown } }
	runInNewContext(code, { module, exports: module.exports, ...globals })
	return Array.from(module.exports.result as unknown[])
}

describe('Published package single entry point', () => {
	it('publishes one self-contained JavaScript module', () => {
		const outputDirectory = join(consumer, 'node_modules/i18xs/build')
		const modules = Array.from(new Bun.Glob('**/*.js').scanSync({ cwd: outputDirectory }))
		expect(modules).toEqual(['index.js'])
		const code = readFileSync(join(outputDirectory, 'index.js'), 'utf8')
		const scanned = new Bun.Transpiler({ loader: 'js' }).scan(code)
		expect(scanned.imports).toEqual([])
		expect(scanned.exports).toEqual(['default'])
	})

	it('loads real localization files through a native Node.js ESM import', () => {
		const result = run('node', ['node.mjs'])
		expect(result.stderr).toBe('')
		expect(result.status).toBe(0)
	})

	it('loads real localization files through the Bun package entry point', () => {
		const result = run(process.execPath, ['node.mjs'])
		expect(result.stderr).toBe('')
		expect(result.status).toBe(0)
	})

	it('uses an available require loader when getBuiltinModule is unavailable', () => {
		writeFileSync(
			join(consumer, 'require-fallback.mjs'),
			`
import { createRequire } from 'node:module'
process.getBuiltinModule = undefined
globalThis.require = createRequire(import.meta.url)
const {default:I18XS} = await import('i18xs')
const i18n = new I18XS({localesDir:${JSON.stringify(join(packageRoot, 'src/tests/data/locales'))}})
if (i18n.t('general.Hello_World') !== 'Hello World') throw new Error('require fallback did not load files')
`
		)
		const result = run('node', ['require-fallback.mjs'])
		expect(result.stderr).toBe('')
		expect(result.status).toBe(0)
	})

	it('loads files with Bun require when getBuiltinModule is unavailable', () => {
		writeFileSync(
			join(consumer, 'bun-require.mjs'),
			`
process.getBuiltinModule = undefined
const {default:I18XS} = await import('i18xs')
const i18n = new I18XS({localesDir:${JSON.stringify(join(packageRoot, 'src/tests/data/locales'))}})
if (i18n.t('general.Hello_World') !== 'Hello World') throw new Error('Bun require did not load files')
`
		)
		const result = run(process.execPath, ['bun-require.mjs'])
		expect(result.stderr).toBe('')
		expect(result.status).toBe(0)
	})

	it('bundles the same entry for browsers without process, require, or filesystem access', async () => {
		const code = await bundlePortableConsumer()
		expect(evaluatePortableConsumer(code)).toEqual(['Hello', 'مرحبا', true, 'Fallback'])
		expect(evaluatePortableConsumer(code, { process: { env: { NODE_ENV: 'production' } } })).toEqual([
			'Hello',
			'مرحبا',
			true,
			'Fallback',
		])
		const metadata = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
		expect(metadata.main).toBe('build/index.js')
		expect(metadata['react-native']).toBe(metadata.main)
		expect(existsSync(join(consumer, 'node_modules/i18xs/build/node.js'))).toBe(false)
	})

	it('works with React Native globals without invoking Metro require or Node built-ins', async () => {
		const code = await bundlePortableConsumer()
		const unsupportedLoader = mock(() => {
			throw new Error('Node modules must not be requested')
		})
		expect(
			evaluatePortableConsumer(code, {
				navigator: { product: 'ReactNative' },
				process: {
					env: { NODE_ENV: 'production' },
					versions: { node: '25.2.1' },
					getBuiltinModule: unsupportedLoader,
				},
				require: unsupportedLoader,
			})
		).toEqual(['Hello', 'مرحبا', true, 'Fallback'])
		expect(unsupportedLoader).not.toHaveBeenCalled()
	})

	it('tolerates incomplete Node polyfills while translating in memory', async () => {
		const code = await bundlePortableConsumer()
		expect(
			evaluatePortableConsumer(code, {
				process: { versions: { node: '25.2.1' }, getBuiltinModule: () => ({}) },
			})
		).toEqual(['Hello', 'مرحبا', true, 'Fallback'])
	})

	it('exports usable types for request configuration and undefined localized values', () => {
		writeFileSync(
			join(consumer, 'consumer.ts'),
			`
import I18XS, {type Config} from 'i18xs'
import type {Config as LegacyConfig} from 'i18xs/build/types/Config'
const locales = ['en','ar'] as const
const config: Config & LegacyConfig = {cacheTtl:300, supportedLocales:locales, rtlLocales:['ar'] as const}
const i18n = new I18XS(config)
const value: string | null = i18n.getLocalizedValue({en:'Fallback',ar:undefined})
const empty: null = new I18XS().localizeValue('common', null)
// @ts-expect-error cacheTtl is measured in seconds as a number
new I18XS({cacheTtl:'300'})
void value; void empty
`
		)
		const result = run(resolve(packageRoot, 'node_modules/.bin/tsc'), [
			'--noEmit',
			'--strict',
			'--skipLibCheck',
			'--module',
			'esnext',
			'--moduleResolution',
			'bundler',
			'--target',
			'es2022',
			'consumer.ts',
		])
		expect(result.stdout || result.stderr).toBe('')
		expect(result.status).toBe(0)
	})

	it('supports native Node ESM type resolution without skipping declaration checks', () => {
		writeFileSync(
			join(consumer, 'node-consumer.mts'),
			`
import I18XS, {type Config} from 'i18xs'
import type {Config as LegacyConfig} from 'i18xs/build/types/Config.js'
import type {Localization} from 'i18xs/build/types/Localization.js'
import type {LocalizationData} from 'i18xs/build/types/LocalizationData.js'
import type {LocalizedValue} from 'i18xs/build/types/LocalizedValue.js'
const messages: Localization = {hello:'Hello'}
const data: LocalizationData = messages
const localized: LocalizedValue = {id:'hello',title:'Hello'}
const config: Config & LegacyConfig = {cacheTtl:300, supportedLocales:['en','ar']}
const value: string | null = new I18XS(config).getLocalizedValue({en:'Hello',ar:undefined})
void value; void data; void localized
`
		)
		const result = run(resolve(packageRoot, 'node_modules/.bin/tsc'), [
			'--noEmit',
			'--strict',
			'--module',
			'nodenext',
			'--moduleResolution',
			'nodenext',
			'--target',
			'es2022',
			'node-consumer.mts',
		])
		expect(result.stdout || result.stderr).toBe('')
		expect(result.status).toBe(0)
	})
})
