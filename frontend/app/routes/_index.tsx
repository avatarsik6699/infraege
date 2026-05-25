import HomePage from '@pages/home';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/',
		description: 'Reusable FastAPI + React Router SSR template.',
		profile: 'publicIndexable',
	});
}

export default function HomeRoute() {
	return <HomePage />;
}
