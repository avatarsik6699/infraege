import { PlaceholderPage } from '@pages/placeholder';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/practice/:id',
		title: 'Практика',
		description: 'Тренажер задания ЕГЭ по информатике.',
		profile: 'publicNoIndex',
	});
}

export default function PracticeRoute() {
	return (
		<PlaceholderPage
			kicker='Тренажер'
			title='Практика'
			description='Тренажер, проверка ответа и гостевой прогресс будут добавлены отдельной фазой.'
			ctaHref='/topics'
			ctaLabel='Выбрать тему'
		/>
	);
}
