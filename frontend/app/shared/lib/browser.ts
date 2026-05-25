function getWindow(): Window | null {
	return globalThis.window ?? null;
}

function getDocument(): Document | null {
	return globalThis.document ?? null;
}

function getNavigator(): Navigator | null {
	return globalThis.navigator ?? null;
}

function hasServiceWorker(): boolean {
	return getNavigator()?.serviceWorker !== undefined;
}

export const browser = {
	getWindow,
	getDocument,
	getNavigator,
	hasServiceWorker,
} as const;
