function toDate(value: string | number | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

function formatDate(value: string | number | Date, locale = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	}).format(toDate(value));
}

function formatDateTime(value: string | number | Date, locale = 'en-US'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(toDate(value));
}

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export const date = {
	formatDate,
	formatDateTime,
	todayIso,
} as const;
