import { setFileSystem } from './fileSystem'
import { isNodeJS } from './isNodeJS'

export function initializeFileSystem(): void {
	if (!isNodeJS()) return
	const runtime = process as typeof process & { getBuiltinModule?: (name: string) => unknown }
	let loadBuiltin: ((name: string) => unknown) | undefined
	if (typeof runtime.getBuiltinModule === 'function') loadBuiltin = runtime.getBuiltinModule.bind(runtime)
	else if (typeof require === 'function') loadBuiltin = require
	if (!loadBuiltin) return

	try {
		const fs = loadBuiltin('fs') as typeof import('node:fs') | undefined
		const path = loadBuiltin('path') as typeof import('node:path') | undefined
		if (
			typeof fs?.existsSync !== 'function' ||
			typeof fs?.readFileSync !== 'function' ||
			typeof fs?.readdirSync !== 'function' ||
			typeof path?.resolve !== 'function'
		)
			return
		setFileSystem({
			exists: fs.existsSync,
			readFile: (filePath) => fs.readFileSync(filePath, 'utf8'),
			readDirectory: (directory) => fs.readdirSync(directory).sort(),
			resolvePath: path.resolve,
		})
	} catch {
		// Runtimes without Node built-ins use caller-provided localizations.
	}
}
