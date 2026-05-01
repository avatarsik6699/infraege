export namespace SafeJsonTypes {
	export type TypeGuard<T> = (value: unknown) => value is T;
}

function parse<T>(raw: string, guard: SafeJsonTypes.TypeGuard<T>): T | null {
	try {
		const parsed: unknown = JSON.parse(raw);
		return guard(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function stringify(value: unknown): string | null {
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

export const safeJson = {
	parse,
	stringify,
} as const;
