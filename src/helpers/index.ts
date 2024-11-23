/**
 * Checks if the current environment is Node.js by verifying the presence of Node-specific globals.
 *
 * @returns {boolean} True if running in a Node.js environment, false otherwise.
 *
 * @example
 * const isNode = isNodeJS();
 * console.log(isNode); // true in Node.js, false in browser
 */
export function isNodeJS(): boolean {
	try {
		return typeof process !== 'undefined' && process.versions != null && process.versions.node != null
	} catch {
		return false
	}
}
