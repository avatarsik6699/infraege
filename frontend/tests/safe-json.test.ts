import { describe, expect, it } from 'vitest';

import { safeJson } from '@shared/lib/safe-json';

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

type NumberRecord = { count: number };

function isNumberRecord(value: unknown): value is NumberRecord {
	return (
		typeof value === 'object' &&
		value !== null &&
		'count' in value &&
		typeof (value as Record<string, unknown>).count === 'number'
	);
}

describe('safeJson.parse', () => {
	it('returns parsed value when guard passes', () => {
		expect(safeJson.parse('"hello"', isString)).toBe('hello');
	});

	it('returns null for invalid JSON or rejected shape', () => {
		expect(safeJson.parse('{invalid}', isString)).toBeNull();
		expect(safeJson.parse('42', isString)).toBeNull();
		expect(safeJson.parse('{"count":"x"}', isNumberRecord)).toBeNull();
	});

	it('parses an object and validates it', () => {
		expect(safeJson.parse('{"count":5}', isNumberRecord)).toEqual({ count: 5 });
	});
});

describe('safeJson.stringify', () => {
	it('serializes values and returns null for circular references', () => {
		expect(safeJson.stringify({ key: 'value' })).toBe('{"key":"value"}');
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		expect(safeJson.stringify(circular)).toBeNull();
	});
});
