import ProfilePage from '@pages/profile';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/profile',
		title: 'Профиль',
		description: 'Профиль и статистика пользователя infraege.',
		profile: 'privateNoIndex',
	});
}

export default function ProfileRoute() {
	return <ProfilePage />;
}
