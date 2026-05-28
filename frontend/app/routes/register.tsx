import RegisterPage from '@pages/auth/register';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/register',
		title: 'Регистрация',
		description: 'Регистрация в infraege с согласием 152-ФЗ.',
		profile: 'privateNoIndex',
	});
}

export default function RegisterRoute() {
	return <RegisterPage />;
}
