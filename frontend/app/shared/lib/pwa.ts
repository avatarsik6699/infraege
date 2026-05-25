import { runtime } from '@shared/config/runtime';
import { browser } from '@shared/lib/browser';

let registrationStarted = false;

export function registerPwaServiceWorker(): void {
	if (!runtime.isProd || !runtime.hasWindow || registrationStarted || !browser.hasServiceWorker()) {
		return;
	}

	registrationStarted = true;

	void import('virtual:pwa-register').then(({ registerSW }) => {
		registerSW({
			immediate: true,
		});
	});
}
