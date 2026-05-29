import { syncProgress } from '@entities/user/api/users';
import type { SyncAttemptItem } from '@entities/user/model/user.types';
import { guestProgressStore } from '@features/guest-progress/guest-progress-store';

export type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export type SyncResult = {
	synced: number;
	updated: number;
};

export async function syncGuestProgress(): Promise<SyncResult> {
	const state = guestProgressStore.read();
	const attempts = Object.values(state.attempts);

	if (attempts.length === 0) {
		return { synced: 0, updated: 0 };
	}

	const payload: SyncAttemptItem[] = attempts.map(a => ({
		practiceItemId: a.itemId,
		isCorrect: a.isCorrect,
		attemptsCount: a.attemptsCount,
		lastAnsweredAt: a.lastAnsweredAt,
	}));

	const result = await syncProgress({ attempts: payload });

	// Clear guest progress after successful sync
	guestProgressStore.clear();

	return result;
}
