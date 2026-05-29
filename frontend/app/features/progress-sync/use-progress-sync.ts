import { useCallback, useRef, useState } from 'react';

import { syncGuestProgress, type SyncResult, type SyncState } from './progress-sync';

export type UseSyncProgressReturn = {
	syncState: SyncState;
	syncResult: SyncResult | null;
	triggerSync: () => Promise<void>;
};

export function useProgressSync(): UseSyncProgressReturn {
	const [syncState, setSyncState] = useState<SyncState>('idle');
	const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
	const inFlight = useRef(false);

	const triggerSync = useCallback(async (): Promise<void> => {
		if (inFlight.current) return;
		inFlight.current = true;
		setSyncState('syncing');
		try {
			const result = await syncGuestProgress();
			setSyncResult(result);
			setSyncState('done');
		} catch {
			setSyncState('error');
		} finally {
			inFlight.current = false;
		}
	}, []);

	return { syncState, syncResult, triggerSync };
}
