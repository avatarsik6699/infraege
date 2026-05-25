import { runtime } from '@shared/config/runtime';

let registrationStarted = false;

export function registerPwaServiceWorker(): void {
	if (!runtime.isProd || !runtime.hasWindow || registrationStarted || !('serviceWorker' in navigator)) {
		return;
	}

	registrationStarted = true;

	void import('virtual:pwa-register').then(({ registerSW }) => {
		registerSW({
			immediate: true,
		});
	});
}
