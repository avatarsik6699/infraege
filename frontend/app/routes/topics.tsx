import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/topics',
		title: 'Темы',
		description: 'Каталог заданий ЕГЭ по информатике.',
		profile: 'publicIndexable',
	});
}

export default function TopicsRoute() {
	return (
		<PlaceholderPage
			kicker='Каталог'
			title='Темы ЕГЭ'
			description='Здесь появится каталог 27 заданий с фильтрами, прогрессом и быстрым переходом к теории.'
			ctaHref='/'
			ctaLabel='На главную'
		/>
	);
}
