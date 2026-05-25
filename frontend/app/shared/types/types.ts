export namespace Utils {
	export type Nil = null | undefined;
	export type Nullable<T> = T | null;
	export type Optional<T> = T | undefined;
	export type Nullish<T> = T | Nil;
	export type MaybePromise<T> = T | Promise<T>;
	export type TypeGuard<T> = (value: unknown) => value is T;
	export type Predicate<T = unknown> = (value: T) => boolean;
	export type NonEmptyArray<T> = [T, ...T[]];
	export type ValueOf<T> = T[keyof T];
	export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };
}

export namespace GlobalTypes {
	export type UnknownRecord = Record<string, unknown>;
	export type JsonPrimitive = string | number | boolean | null;
	export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
	export type RequestStatus = 'idle' | 'pending' | 'success' | 'error';
}
