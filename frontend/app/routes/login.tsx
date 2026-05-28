import LoginPage from '@pages/auth/login';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/login',
		title: 'Вход',
		description: 'Вход в аккаунт infraege.',
		profile: 'privateNoIndex',
	});
}

export default function LoginRoute() {
	return <LoginPage />;
}
