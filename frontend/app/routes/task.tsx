import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/tasks/:slug',
		title: 'Теория',
		description: 'Страница теории по заданию ЕГЭ.',
		profile: 'publicIndexable',
	});
}

export default function TaskRoute() {
	return (
		<PlaceholderPage
			kicker='Теория'
			title='Страница задания'
			description='В следующих фазах здесь будут теория, оглавление, примеры кода и переход к практике.'
			ctaHref='/topics'
			ctaLabel='К темам'
		/>
	);
}
