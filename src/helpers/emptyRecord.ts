export function emptyRecord<T>(): Record<string, T> {
	return Object.create(null) as Record<string, T>
}
