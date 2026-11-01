export type FileSystem = {
	exists: (path: string) => boolean
	readFile: (path: string) => string
	readDirectory: (path: string) => string[]
	resolvePath: (...paths: string[]) => string
}

export let fileSystem: FileSystem | undefined

export function setFileSystem(adapter: FileSystem): void {
	fileSystem = adapter
}
