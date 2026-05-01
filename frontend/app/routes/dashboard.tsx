import { DashboardPage } from '@pages/dashboard/ui/dashboard-page';

export function meta() {
	return [{ title: 'Dashboard - Template App' }];
}

export default function DashboardRoute() {
	return <DashboardPage />;
}
