import { useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useRouteError } from 'react-router';

import { env } from '@shared/config/env';
import { appError } from '@shared/lib/app-error';
import { AppProvider } from '@shared/lib/app-provider';
import { globalErrorNotifier } from '@shared/lib/global-error-notifier';
import { registerPwaServiceWorker } from '@shared/lib/pwa';
import { AppTopBar } from '@shared/ui/app-top-bar';
import { ErrorState } from '@shared/ui/error-state';
import { NavigationProgress } from '@shared/ui/navigation-progress';

import './styles/app.css';

function getOrCreateSessionId(): string {
	const key = '__pv_sid';
	try {
		let sid = sessionStorage.getItem(key);
		if (!sid) {
			sid = Array.from(crypto.getRandomValues(new Uint8Array(8)))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');
			sessionStorage.setItem(key, sid);
		}
		return sid;
	} catch {
		return '0000000000000000';
	}
}

function buildPageviewUrl(): string {
	const base = env.client.apiBaseUrl.endsWith('/') ? env.client.apiBaseUrl : `${env.client.apiBaseUrl}/`;
	return new URL('api/v1/public/events/pageview', base).toString();
}

function usePageviewTracker() {
	const location = useLocation();
	useEffect(() => {
		const path = location.pathname;
		const session_id = getOrCreateSessionId();
		void fetch(buildPageviewUrl(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path, session_id }),
			keepalive: true,
		}).catch(() => undefined);
	}, [location.pathname]);
}

export function links() {
	return [
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
		{ rel: 'apple-touch-icon', href: '/pwa-icon.svg' },
	];
}

export default function App() {
	useEffect(() => {
		registerPwaServiceWorker();
	}, []);

	usePageviewTracker();

	return (
		<html lang='ru' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<meta name='theme-color' content='#ffffff' />
				<Meta />
				<Links />
			</head>
			<body>
				<a href='#main-content' className='skip-link'>
					Перейти к основному содержимому
				</a>
				<AppProvider>
					<NavigationProgress />
					<AppTopBar />
					<div id='main-content' tabIndex={-1} className='outline-none'>
						<Outlet />
					</div>
				</AppProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const routeError = useRouteError();
	const error = appError.toUiError(routeError);

	useEffect(() => {
		globalErrorNotifier.notifyError(error.message);
	}, [error.message]);

	return (
		<html lang='ru' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<meta name='theme-color' content='#ffffff' />
				<Meta />
				<Links />
			</head>
			<body>
				<AppProvider>
					<main className='shell'>
						<ErrorState title='Ошибка приложения' error={error} />
					</main>
				</AppProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
