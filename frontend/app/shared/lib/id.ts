import { browser } from '@shared/lib/browser';
import { random, type RandomSource } from '@shared/lib/random';
import { isNonEmptyString, isNonNil } from '@shared/lib/type-guards';

type CreateIdOptions = {
	prefix?: string;
	randomSource?: RandomSource;
};

let fallbackCounter = 0;

function createFallbackId(prefix: string, randomSource?: RandomSource): string {
	fallbackCounter += 1;
	const randomPart = Math.floor(random.randomFloat(randomSource) * Number.MAX_SAFE_INTEGER).toString(36);
	return `${prefix}_${fallbackCounter.toString(36)}_${randomPart}`;
}

function createId(options: CreateIdOptions = {}): string {
	const prefix = options.prefix ?? 'id';
	if (isNonNil(options.randomSource)) {
		return createFallbackId(prefix, options.randomSource);
	}

	const uuid = browser.getWindow()?.crypto?.randomUUID?.() ?? globalThis.crypto?.randomUUID?.();
	return isNonEmptyString(uuid) ? `${prefix}_${uuid}` : createFallbackId(prefix);
}

export const id = {
	createId,
} as const;
