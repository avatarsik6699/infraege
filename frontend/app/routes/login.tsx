import LoginPage from '@pages/auth/login';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/login',
		title: 'Login',
		description: 'Sign in to Template App.',
		profile: 'privateNoIndex',
	});
}

export default function LoginRoute() {
	return <LoginPage />;
}
