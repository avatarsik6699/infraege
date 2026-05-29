import { useQuery } from '@tanstack/react-query';

import { getPageviewStats, type DailyViews, type TopPage } from '@entities/analytics/api/analytics';
import { analyticsQueryKeys } from '@shared/api/keys';
import { AdminNav } from '@shared/ui/admin-nav';
import { Skeleton } from '@shared/ui/skeleton';

function TopPagesTable({ pages }: { pages: TopPage[] }) {
	if (pages.length === 0) {
		return <p className='text-muted-foreground text-sm'>Нет данных.</p>;
	}
	return (
		<div className='overflow-x-auto rounded-xl border border-border'>
			<table className='w-full text-sm' role='table' aria-label='Топ страниц'>
				<thead>
					<tr className='border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide'>
						<th scope='col' className='px-4 py-3'>
							Страница
						</th>
						<th scope='col' className='px-4 py-3 text-right'>
							Просмотры
						</th>
					</tr>
				</thead>
				<tbody>
					{pages.map(p => (
						<tr key={p.path} className='border-b border-border last:border-0 hover:bg-muted/30 transition-colors'>
							<td className='px-4 py-2 font-mono text-xs truncate max-w-xs' title={p.path}>
								{p.path}
							</td>
							<td className='px-4 py-2 text-right tabular-nums'>{p.views.toLocaleString('ru-RU')}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function DailyChart({ daily }: { daily: DailyViews[] }) {
	if (daily.length === 0) {
		return <p className='text-muted-foreground text-sm'>Нет данных за последние 30 дней.</p>;
	}
	const max = Math.max(...daily.map(d => d.views), 1);
	return (
		<div className='overflow-x-auto'>
			<div className='flex items-end gap-1 h-40 min-w-[400px]' role='img' aria-label='График просмотров по дням'>
				{daily.map(d => {
					const pct = Math.round((d.views / max) * 100);
					return (
						<div key={d.date} className='flex flex-col items-center flex-1 min-w-[8px]' title={`${d.date}: ${d.views}`}>
							<div
								className='w-full rounded-t bg-primary/70 transition-all'
								style={{ height: `${pct}%` }}
								aria-label={`${d.date}: ${d.views} просмотров`}
							/>
						</div>
					);
				})}
			</div>
			<div className='flex justify-between text-xs text-muted-foreground mt-1 min-w-[400px]'>
				<span>{daily[0]?.date}</span>
				<span>{daily[daily.length - 1]?.date}</span>
			</div>
		</div>
	);
}

function AnalyticsSkeleton() {
	return (
		<div className='space-y-10' aria-busy='true' aria-live='polite' aria-label='Загрузка аналитики'>
			<section>
				<Skeleton className='mb-4 h-6 w-72' />
				<div className='flex h-40 min-w-[400px] items-end gap-1 overflow-hidden'>
					{Array.from({ length: 18 }, (_, index) => (
						<Skeleton key={index} className='flex-1 rounded-t' style={{ height: `${24 + ((index * 17) % 68)}%` }} />
					))}
				</div>
				<div className='mt-2 flex justify-between'>
					<Skeleton className='h-3 w-20' />
					<Skeleton className='h-3 w-20' />
				</div>
			</section>
			<section>
				<Skeleton className='mb-4 h-6 w-32' />
				<div className='rounded-xl border border-border'>
					{Array.from({ length: 5 }, (_, index) => (
						<div key={index} className='grid grid-cols-[1fr_96px] gap-4 border-b border-border p-4 last:border-0'>
							<Skeleton className='h-4 w-full max-w-xs' />
							<Skeleton className='h-4 w-16 justify-self-end' />
						</div>
					))}
				</div>
			</section>
			<span className='sr-only'>Загрузка...</span>
		</div>
	);
}

export function AdminAnalyticsPage() {
	const { data, isLoading, isError } = useQuery({
		queryKey: analyticsQueryKeys.pageviews(),
		queryFn: ({ signal }) => getPageviewStats(signal),
	});

	return (
		<main className='page-shell'>
			<div className='mx-auto max-w-5xl px-4 py-8'>
				<h1 className='text-2xl font-bold mb-8'>Аналитика просмотров</h1>
				<AdminNav />

				{isLoading ? (
					<AnalyticsSkeleton />
				) : isError ? (
					<p className='text-destructive' role='alert'>
						Не удалось загрузить данные.
					</p>
				) : data ? (
					<div className='space-y-10'>
						<section>
							<h2 className='text-lg font-semibold mb-4'>Просмотры по дням (последние 30 дней)</h2>
							<DailyChart daily={data.daily} />
						</section>
						<section>
							<h2 className='text-lg font-semibold mb-4'>Топ страниц</h2>
							<TopPagesTable pages={data.top_pages} />
						</section>
					</div>
				) : null}
			</div>
		</main>
	);
}
