import { AdminStatusPage } from '@pages/admin/status';
import { buildRouteMeta } from '@shared/lib/seo';

export function meta() {
	return buildRouteMeta({
		pathname: '/admin/status',
		title: 'Состояние системы',
		description: 'Мониторинг состояния базы данных, Redis и диска.',
		profile: 'privateNoIndex',
	});
}

export default function AdminStatusRoute() {
	return <AdminStatusPage />;
}
