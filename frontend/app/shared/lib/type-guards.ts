import type { GlobalTypes } from '@shared/types/types';

export function isNull(value: unknown): value is null {
	return value === null;
}

export function isUndefined(value: unknown): value is undefined {
	return value === undefined;
}

export function isNil(value: unknown): value is null | undefined {
	return isNull(value) || isUndefined(value);
}

export function isNonNil<T>(value: T): value is NonNullable<T> {
	return !isNil(value);
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isNonEmptyString(value: unknown): value is string {
	return isString(value) && value.length > 0;
}

export function isNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is (...args: never[]) => unknown {
	return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
	return typeof value === 'object' && !isNil(value);
}

export function isRecord(value: unknown): value is GlobalTypes.UnknownRecord {
	return isObject(value) && !Array.isArray(value);
}

export function hasOwnProperty<TKey extends PropertyKey>(
	value: unknown,
	key: TKey
): value is GlobalTypes.UnknownRecord & Record<TKey, unknown> {
	return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}

export function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
	return Array.isArray(value) && value.every(guard);
}
