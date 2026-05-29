import { useQuery } from '@tanstack/react-query';

import { getDetailedHealth, type DetailedHealth } from '@entities/analytics/api/analytics';
import { analyticsQueryKeys } from '@shared/api/keys';
import { AdminNav } from '@shared/ui/admin-nav';
import { Skeleton } from '@shared/ui/skeleton';

type HealthStatus = 'ok' | 'error';

function StatusTile({ label, status }: { label: string; status: HealthStatus }) {
	const isOk = status === 'ok';
	return (
		<div
			className={`rounded-xl border p-5 flex flex-col gap-2 ${isOk ? 'border-green-500/40 bg-green-50 dark:bg-green-950/20' : 'border-red-500/40 bg-red-50 dark:bg-red-950/20'}`}
			role='status'
			aria-label={`${label}: ${status}`}
		>
			<span className='text-sm font-medium text-muted-foreground'>{label}</span>
			<span
				className={`text-2xl font-bold ${isOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
			>
				{isOk ? '✓ OK' : '✗ Error'}
			</span>
		</div>
	);
}

function DiskTile({ disk }: { disk: DetailedHealth['disk'] }) {
	const isLow = disk.pct >= 85;
	return (
		<div
			className={`rounded-xl border p-5 flex flex-col gap-2 ${isLow ? 'border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border bg-card'}`}
			role='status'
			aria-label={`Диск: ${disk.pct}% заполнен`}
		>
			<span className='text-sm font-medium text-muted-foreground'>Диск</span>
			<span className={`text-2xl font-bold ${isLow ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{disk.pct}%</span>
			<span className='text-xs text-muted-foreground'>
				{disk.used_gb} ГБ из {(disk.used_gb + disk.free_gb).toFixed(1)} ГБ
			</span>
		</div>
	);
}

function StatusSkeleton() {
	return (
		<div
			className='grid grid-cols-1 gap-4 sm:grid-cols-3'
			aria-busy='true'
			aria-live='polite'
			aria-label='Загрузка состояния системы'
		>
			{['db', 'redis', 'disk'].map(item => (
				<div key={item} className='rounded-xl border border-border bg-card p-5'>
					<Skeleton className='h-4 w-20' />
					<Skeleton className='mt-4 h-8 w-24' />
					<Skeleton className='mt-3 h-3 w-32' />
				</div>
			))}
			<span className='sr-only'>Загрузка...</span>
		</div>
	);
}

export function AdminStatusPage() {
	const { data, isLoading, isError, dataUpdatedAt } = useQuery({
		queryKey: analyticsQueryKeys.detailedHealth(),
		queryFn: ({ signal }) => getDetailedHealth(signal),
		refetchInterval: 30_000,
	});

	const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU') : null;

	return (
		<main className='page-shell'>
			<div className='mx-auto max-w-3xl px-4 py-8'>
				<div className='flex items-center justify-between mb-8'>
					<h1 className='text-2xl font-bold'>Состояние системы</h1>
					{updatedAt && <span className='text-xs text-muted-foreground'>Обновлено: {updatedAt}</span>}
				</div>
				<AdminNav />

				{isLoading ? (
					<StatusSkeleton />
				) : isError ? (
					<p className='text-destructive' role='alert'>
						Не удалось загрузить данные. Проверьте авторизацию.
					</p>
				) : data ? (
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						<StatusTile label='База данных' status={data.db} />
						<StatusTile label='Redis' status={data.redis} />
						<DiskTile disk={data.disk} />
					</div>
				) : null}
			</div>
		</main>
	);
}
