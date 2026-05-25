import RegisterPage from '@pages/auth/register';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/register',
		title: 'Register',
		description: 'Create a Template App account.',
		profile: 'privateNoIndex',
	});
}

export default function RegisterRoute() {
	return <RegisterPage />;
}
