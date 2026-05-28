import { useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from 'react-router';

import { appError } from '@shared/lib/app-error';
import { AppProvider } from '@shared/lib/app-provider';
import { globalErrorNotifier } from '@shared/lib/global-error-notifier';
import { registerPwaServiceWorker } from '@shared/lib/pwa';
import { AppTopBar } from '@shared/ui/app-top-bar';
import { ErrorState } from '@shared/ui/error-state';

import './styles/app.css';

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
					<AppTopBar />
					<div className='pt-20'>
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
					<AppTopBar />
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
