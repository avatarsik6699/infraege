import { afterEach, describe, expect, it, vi } from 'vitest';

import { browser } from '@shared/lib/browser';

describe('browser', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns null when browser globals are unavailable', () => {
		vi.stubGlobal('window', undefined);
		vi.stubGlobal('document', undefined);
		vi.stubGlobal('navigator', undefined);

		expect(browser.getWindow()).toBeNull();
		expect(browser.getDocument()).toBeNull();
		expect(browser.getNavigator()).toBeNull();
		expect(browser.hasServiceWorker()).toBe(false);
	});

	it('returns browser globals when they are available', () => {
		const windowRef = { crypto: {} } as Window;
		const documentRef = { title: 'Test' } as Document;
		const navigatorRef = { serviceWorker: {} } as Navigator;

		vi.stubGlobal('window', windowRef);
		vi.stubGlobal('document', documentRef);
		vi.stubGlobal('navigator', navigatorRef);

		expect(browser.getWindow()).toBe(windowRef);
		expect(browser.getDocument()).toBe(documentRef);
		expect(browser.getNavigator()).toBe(navigatorRef);
		expect(browser.hasServiceWorker()).toBe(true);
	});
});
