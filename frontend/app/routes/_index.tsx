import HomePage from '@pages/home';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/',
		description: 'Подготовка к ЕГЭ по информатике: теория, практика и прогресс.',
		profile: 'publicIndexable',
	});
}

export default function HomeRoute() {
	return <HomePage />;
}
