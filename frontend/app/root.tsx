import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError } from 'react-router';

import { appError } from '@shared/lib/app-error';
import { AppProvider } from '@shared/lib/app-provider';
import { globalErrorNotifier } from '@shared/lib/global-error-notifier';
import { AppTopBar } from '@shared/ui/app-top-bar';
import { ErrorState } from '@shared/ui/error-state';

import './styles/app.css';

export default function App() {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
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
	const { t } = useTranslation('errors');
	const routeError = useRouteError();
	const error = appError.toUiError(routeError);

	useEffect(() => {
		globalErrorNotifier.notifyError(error.message);
	}, [error.message]);

	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body>
				<AppProvider>
					<AppTopBar />
					<main className='shell'>
						<ErrorState title={t('applicationError')} error={error} />
					</main>
				</AppProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
