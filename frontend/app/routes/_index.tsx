import HomePage from '@pages/home';

export function meta() {
	return [{ title: 'Template App' }, { name: 'description', content: 'Reusable FastAPI + React Router SSR template.' }];
}

export default function HomeRoute() {
	return <HomePage />;
}
