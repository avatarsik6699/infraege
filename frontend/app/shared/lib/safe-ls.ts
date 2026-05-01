import { runtime } from '@shared/config/runtime';
import { safeJson, type SafeJsonTypes } from '@shared/lib/safe-json';

export namespace SafeLsTypes {
	export type VersionedStorageValue<T> = {
		version: number;
		data: T;
	};

	export type Key<T> = {
		key: string;
		version: number;
		guard: SafeJsonTypes.TypeGuard<T>;
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createEnvelopeGuard<T>(
	definition: SafeLsTypes.Key<T>
): SafeJsonTypes.TypeGuard<SafeLsTypes.VersionedStorageValue<T>> {
	return (value: unknown): value is SafeLsTypes.VersionedStorageValue<T> => {
		if (!isRecord(value)) {
			return false;
		}

		return value.version === definition.version && definition.guard(value.data);
	};
}

function getLocalStorage(): Storage | null {
	if (runtime.isServer) {
		return null;
	}

	try {
		return window.localStorage ?? null;
	} catch {
		return null;
	}
}

function get<T>(definition: SafeLsTypes.Key<T>): T | null {
	const storage = getLocalStorage();
	if (!storage) {
		return null;
	}

	let raw: string | null;
	try {
		raw = storage.getItem(definition.key);
	} catch {
		return null;
	}

	if (!raw) {
		return null;
	}

	const envelope = safeJson.parse(raw, createEnvelopeGuard(definition));
	if (!envelope) {
		remove(definition);
		return null;
	}

	return envelope.data;
}

function set<T>(definition: SafeLsTypes.Key<T>, data: T): void {
	const storage = getLocalStorage();
	if (!storage) {
		return;
	}

	const serialized = safeJson.stringify({
		version: definition.version,
		data,
	} satisfies SafeLsTypes.VersionedStorageValue<T>);

	if (!serialized) {
		return;
	}

	try {
		storage.setItem(definition.key, serialized);
	} catch {
		return;
	}
}

function remove<T>(definition: SafeLsTypes.Key<T>): void {
	const storage = getLocalStorage();
	if (!storage) {
		return;
	}

	try {
		storage.removeItem(definition.key);
	} catch {
		return;
	}
}

export const safeLs = {
	get,
	set,
	remove,
} as const;
