import { TermsPage } from '@pages/legal/terms-page';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/terms',
		title: 'Условия использования',
		description: 'Условия использования образовательного сервиса infraege.',
		profile: 'publicIndexable',
	});
}

export default function TermsRoute() {
	return <TermsPage />;
}
