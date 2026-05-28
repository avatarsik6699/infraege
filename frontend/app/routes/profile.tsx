import { PlaceholderPage } from '@pages/placeholder';
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
	return (
		<PlaceholderPage
			kicker='Аккаунт'
			title='Профиль'
			description='Статистика, слабые темы и синхронизация прогресса относятся к будущей фазе.'
			ctaHref='/login'
			ctaLabel='Войти'
		/>
	);
}
