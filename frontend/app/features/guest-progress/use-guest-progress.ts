import { useCallback, useEffect, useState } from 'react';

import {
	guestProgressStore,
	type GuestAttemptInput,
	type GuestProgressState,
} from '@features/guest-progress/guest-progress-store';

export function useGuestProgress() {
	const [progress, setProgress] = useState<GuestProgressState>(() => guestProgressStore.read());

	useEffect(() => guestProgressStore.subscribe(() => setProgress(guestProgressStore.read())), []);

	const recordAttempt = useCallback((input: GuestAttemptInput) => {
		setProgress(guestProgressStore.recordAttempt(input));
	}, []);

	const reset = useCallback(() => {
		setProgress(guestProgressStore.reset());
	}, []);

	return {
		progress,
		recordAttempt,
		reset,
		isItemSolved: useCallback((itemId: string) => guestProgressStore.isItemSolved(itemId, progress), [progress]),
		getSolvedCount: useCallback(
			(itemIds: string[]) => guestProgressStore.getSolvedCount(itemIds, progress),
			[progress]
		),
	};
}
