import { DashboardPage } from '@pages/dashboard/ui/dashboard-page';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/dashboard',
		title: 'Dashboard',
		description: 'Template App authenticated dashboard.',
		profile: 'privateNoIndex',
	});
}

export default function DashboardRoute() {
	return <DashboardPage />;
}
