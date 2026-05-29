import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
	listAdminFeedback,
	patchFeedbackStatus,
	type FeedbackReportAdmin,
	type FeedbackStatus,
} from '@entities/feedback/api/feedback';
import { feedbackQueryKeys } from '@shared/api/keys';
import { AdminNav } from '@shared/ui/admin-nav';
import { Button } from '@shared/ui/button';
import { Skeleton } from '@shared/ui/skeleton';

const STATUS_LABELS: Record<FeedbackStatus, string> = {
	new: 'Новый',
	reviewed: 'Рассмотрен',
	archived: 'Архив',
};

const STATUS_NEXT: Record<FeedbackStatus, FeedbackStatus> = {
	new: 'reviewed',
	reviewed: 'archived',
	archived: 'new',
};

function StatusChip({ status }: { status: FeedbackStatus }) {
	const colours: Record<FeedbackStatus, string> = {
		new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		reviewed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		archived: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
	};
	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status]}`}>
			{STATUS_LABELS[status]}
		</span>
	);
}

function FeedbackRow({
	report,
	onStatusChange,
	isPending,
}: {
	report: FeedbackReportAdmin;
	onStatusChange: (id: string, status: FeedbackStatus) => void;
	isPending: boolean;
}) {
	return (
		<tr className='border-b border-border hover:bg-muted/30 transition-colors'>
			<td className='px-4 py-3 text-sm text-muted-foreground max-w-[120px] truncate' title={report.page_url}>
				{report.page_url}
			</td>
			<td className='px-4 py-3 text-sm max-w-[300px]'>
				<p className='line-clamp-3 whitespace-pre-wrap'>{report.message}</p>
			</td>
			<td className='px-4 py-3 text-xs text-muted-foreground'>
				{new Date(report.submitted_at).toLocaleString('ru-RU', {
					day: '2-digit',
					month: 'short',
					hour: '2-digit',
					minute: '2-digit',
				})}
			</td>
			<td className='px-4 py-3'>
				<StatusChip status={report.status} />
			</td>
			<td className='px-4 py-3'>
				<Button
					variant='outline'
					size='xs'
					disabled={isPending}
					onClick={() => onStatusChange(report.id, STATUS_NEXT[report.status])}
					aria-label={`Изменить статус на ${STATUS_LABELS[STATUS_NEXT[report.status]]}`}
				>
					→ {STATUS_LABELS[STATUS_NEXT[report.status]]}
				</Button>
			</td>
		</tr>
	);
}

const STATUS_FILTERS: Array<{ label: string; value: FeedbackStatus | undefined }> = [
	{ label: 'Все', value: undefined },
	{ label: 'Новые', value: 'new' },
	{ label: 'Рассмотренные', value: 'reviewed' },
	{ label: 'Архив', value: 'archived' },
];

function FeedbackTableSkeleton() {
	return (
		<div
			className='overflow-x-auto rounded-xl border border-border'
			aria-busy='true'
			aria-live='polite'
			aria-label='Загрузка обратной связи'
		>
			<table className='w-full text-sm' role='table' aria-label='Загрузка списка обратной связи'>
				<thead>
					<tr className='border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
						<th scope='col' className='px-4 py-3'>
							Страница
						</th>
						<th scope='col' className='px-4 py-3'>
							Сообщение
						</th>
						<th scope='col' className='px-4 py-3'>
							Дата
						</th>
						<th scope='col' className='px-4 py-3'>
							Статус
						</th>
						<th scope='col' className='px-4 py-3'>
							Действие
						</th>
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: 5 }, (_, index) => (
						<tr key={index} className='border-b border-border last:border-0'>
							<td className='px-4 py-3'>
								<Skeleton className='h-4 w-24' />
							</td>
							<td className='px-4 py-3'>
								<Skeleton className='h-4 w-64 max-w-full' />
							</td>
							<td className='px-4 py-3'>
								<Skeleton className='h-4 w-24' />
							</td>
							<td className='px-4 py-3'>
								<Skeleton className='h-6 w-20 rounded-full' />
							</td>
							<td className='px-4 py-3'>
								<Skeleton className='h-6 w-24' />
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<span className='sr-only'>Загрузка...</span>
		</div>
	);
}

export function AdminFeedbackPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<FeedbackStatus | undefined>(undefined);
	const perPage = 20;

	const queryKey = feedbackQueryKeys.adminList({ page, perPage, status: statusFilter });

	const { data, isLoading, isError } = useQuery({
		queryKey,
		queryFn: ({ signal }) => listAdminFeedback({ page, per_page: perPage, status: statusFilter ?? null }, signal),
	});

	const patchMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) => patchFeedbackStatus(id, { status }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.adminList() });
		},
	});

	const totalPages = data ? Math.ceil(data.total / perPage) : 1;

	return (
		<main className='page-shell'>
			<div className='mx-auto max-w-5xl px-4 py-8'>
				<h1 className='text-2xl font-bold mb-6'>Обратная связь</h1>
				<AdminNav />

				<div role='group' aria-label='Фильтр по статусу' className='flex flex-wrap gap-2 mb-6'>
					{STATUS_FILTERS.map(f => (
						<Button
							key={String(f.value)}
							variant={statusFilter === f.value ? 'default' : 'outline'}
							size='sm'
							onClick={() => {
								setStatusFilter(f.value);
								setPage(1);
							}}
						>
							{f.label}
						</Button>
					))}
				</div>

				{isLoading ? (
					<FeedbackTableSkeleton />
				) : isError ? (
					<p className='text-destructive' role='alert'>
						Не удалось загрузить данные.
					</p>
				) : data && data.items.length === 0 ? (
					<p className='text-muted-foreground'>Нет записей.</p>
				) : (
					<div className='overflow-x-auto rounded-xl border border-border'>
						<table className='w-full text-sm' role='table' aria-label='Список обратной связи'>
							<thead>
								<tr className='border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide'>
									<th scope='col' className='px-4 py-3'>
										Страница
									</th>
									<th scope='col' className='px-4 py-3'>
										Сообщение
									</th>
									<th scope='col' className='px-4 py-3'>
										Дата
									</th>
									<th scope='col' className='px-4 py-3'>
										Статус
									</th>
									<th scope='col' className='px-4 py-3'>
										Действие
									</th>
								</tr>
							</thead>
							<tbody>
								{data?.items.map(report => (
									<FeedbackRow
										key={report.id}
										report={report}
										onStatusChange={(id, status) => patchMutation.mutate({ id, status })}
										isPending={patchMutation.isPending}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}

				{data && totalPages > 1 ? (
					<div className='flex items-center justify-between mt-4' aria-label='Пагинация'>
						<Button
							variant='outline'
							size='sm'
							disabled={page <= 1}
							onClick={() => setPage(p => p - 1)}
							aria-label='Предыдущая страница'
						>
							← Назад
						</Button>
						<span className='text-sm text-muted-foreground'>
							Страница {page} из {totalPages} · Всего: {data.total}
						</span>
						<Button
							variant='outline'
							size='sm'
							disabled={page >= totalPages}
							onClick={() => setPage(p => p + 1)}
							aria-label='Следующая страница'
						>
							Вперёд →
						</Button>
					</div>
				) : null}
			</div>
		</main>
	);
}
