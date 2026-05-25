import { describe, expect, expectTypeOf, it } from 'vitest';

import {
	hasOwnProperty,
	isArrayOf,
	isBoolean,
	isNil,
	isNonEmptyString,
	isNonNil,
	isNull,
	isNumber,
	isRecord,
	isString,
	isUndefined,
} from '@shared/lib/type-guards';

describe('type guards', () => {
	it('narrows nullish values', () => {
		const value: string | null | undefined = 'value' as string | null | undefined;

		if (isNonNil(value)) {
			expectTypeOf(value).toEqualTypeOf<string>();
		}

		expect(isNil(null)).toBe(true);
		expect(isNil(undefined)).toBe(true);
		expect(isNil('')).toBe(false);
		expect(isNull(null)).toBe(true);
		expect(isUndefined(undefined)).toBe(true);
	});

	it('narrows primitive values', () => {
		const value: unknown = 'text';

		if (isString(value)) {
			expectTypeOf(value).toEqualTypeOf<string>();
		}

		expect(isString('text')).toBe(true);
		expect(isNonEmptyString('text')).toBe(true);
		expect(isNonEmptyString('')).toBe(false);
		expect(isNumber(1)).toBe(true);
		expect(isNumber(Number.NaN)).toBe(false);
		expect(isBoolean(false)).toBe(true);
	});

	it('narrows records and arrays', () => {
		const value: unknown = { items: ['a', 'b'] };

		expect(isRecord(value)).toBe(true);
		expect(hasOwnProperty(value, 'items')).toBe(true);

		if (hasOwnProperty(value, 'items') && isArrayOf(value.items, isString)) {
			expectTypeOf(value.items).toEqualTypeOf<string[]>();
			expect(value.items).toEqual(['a', 'b']);
		}
	});
});
