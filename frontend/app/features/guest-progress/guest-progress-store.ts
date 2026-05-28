import { date } from '@shared/lib/date';
import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';
import { hasOwnProperty, isBoolean, isNonEmptyString, isNumber, isRecord } from '@shared/lib/type-guards';

export type GuestProgressAttempt = {
	itemId: string;
	taskId: string;
	answer: string;
	isCorrect: boolean;
	attemptsCount: number;
	lastAnsweredAt: string;
};

export type GuestProgressState = {
	version: 1;
	attempts: Record<string, GuestProgressAttempt>;
	streak: number;
	updatedAt: string;
};

export type GuestAttemptInput = {
	itemId: string;
	taskId: string;
	answer: string;
	isCorrect: boolean;
	answeredAt?: string;
};

const STORAGE_KEY: SafeLsTypes.Key<GuestProgressState> = {
	key: 'infraege.guest-progress',
	version: 1,
	guard: isGuestProgressState,
};

const subscribers = new Set<() => void>();

function nowIso(): string {
	return date.nowIso();
}

function emptyState(updatedAt = nowIso()): GuestProgressState {
	return {
		version: 1,
		attempts: {},
		streak: 0,
		updatedAt,
	};
}

function isGuestProgressAttempt(value: unknown): value is GuestProgressAttempt {
	return (
		isRecord(value) &&
		isNonEmptyString(value.itemId) &&
		isNonEmptyString(value.taskId) &&
		typeof value.answer === 'string' &&
		isBoolean(value.isCorrect) &&
		isNumber(value.attemptsCount) &&
		value.attemptsCount >= 1 &&
		isNonEmptyString(value.lastAnsweredAt)
	);
}

function isGuestProgressState(value: unknown): value is GuestProgressState {
	if (!isRecord(value) || value.version !== 1 || !isRecord(value.attempts) || !isNumber(value.streak)) {
		return false;
	}

	return isNonEmptyString(value.updatedAt) && Object.values(value.attempts).every(isGuestProgressAttempt);
}

function read(): GuestProgressState {
	return safeLs.get(STORAGE_KEY) ?? emptyState();
}

function write(state: GuestProgressState): void {
	safeLs.set(STORAGE_KEY, state);
	emit();
}

function emit(): void {
	for (const subscriber of subscribers) subscriber();
}

function subscribe(listener: () => void): () => void {
	subscribers.add(listener);
	return () => {
		subscribers.delete(listener);
	};
}

function recordAttempt(input: GuestAttemptInput): GuestProgressState {
	const current = read();
	const answeredAt = input.answeredAt ?? nowIso();
	const previous = current.attempts[input.itemId];
	const nextAttempt: GuestProgressAttempt = {
		itemId: input.itemId,
		taskId: input.taskId,
		answer: input.answer,
		isCorrect: input.isCorrect,
		attemptsCount: (previous?.attemptsCount ?? 0) + 1,
		lastAnsweredAt: answeredAt,
	};

	const nextState: GuestProgressState = {
		version: 1,
		attempts: {
			...current.attempts,
			[input.itemId]: nextAttempt,
		},
		streak: input.isCorrect ? current.streak + 1 : 0,
		updatedAt: answeredAt,
	};

	write(nextState);
	return nextState;
}

function reset(): GuestProgressState {
	const state = emptyState();
	write(state);
	return state;
}

function clear(): void {
	safeLs.remove(STORAGE_KEY);
	emit();
}

function isItemSolved(itemId: string, state = read()): boolean {
	const attempt = state.attempts[itemId];
	return attempt?.isCorrect === true;
}

function getSolvedCount(itemIds: string[], state = read()): number {
	return itemIds.filter(itemId => hasOwnProperty(state.attempts, itemId) && state.attempts[itemId]?.isCorrect === true)
		.length;
}

export const guestProgressStore = {
	key: STORAGE_KEY.key,
	version: STORAGE_KEY.version,
	read,
	recordAttempt,
	reset,
	clear,
	subscribe,
	isItemSolved,
	getSolvedCount,
} as const;
