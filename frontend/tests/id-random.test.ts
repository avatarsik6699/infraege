import { describe, expect, it } from 'vitest';

import { id } from '@shared/lib/id';
import { random } from '@shared/lib/random';

describe('random', () => {
	it('uses an injectable source', () => {
		expect(random.randomFloat(() => 0.25)).toBe(0.25);
	});

	it('rejects invalid source values', () => {
		expect(() => random.randomFloat(() => 1)).toThrow('[0, 1)');
		expect(() => random.randomFloat(() => Number.NaN)).toThrow('[0, 1)');
	});
});

describe('id', () => {
	it('creates deterministic fallback ids when a random source is provided', () => {
		expect(id.createId({ prefix: 'test', randomSource: () => 0.5 })).toMatch(/^test_[a-z0-9]+_[a-z0-9]+$/);
	});
});
