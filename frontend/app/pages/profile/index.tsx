import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useDeleteAccountMutation, useLogoutMutation, useMe, useSessionSummary } from '@shared/api/auth';
import { progressQueryKeys } from '@shared/api/keys';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

import { useProgressMeQuery } from '@entities/user/api/user-queries';
import type { ProfileMe, ProfileStats, RecentActivity, UserOut, WeakTask } from '@entities/user/model/user.types';

function StatTile({ label, value }: { label: string; value: string | number }) {
	return (
		<div className='rounded-xl border border-border bg-card p-4 text-center'>
			<p className='text-2xl font-bold tabular-nums'>{value}</p>
			<p className='text-xs text-muted-foreground mt-1'>{label}</p>
		</div>
	);
}

function StatsGrid({ stats }: { stats: ProfileStats }) {
	return (
		<div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
			<StatTile label='Задач решено' value={stats.solvedTasks} />
			<StatTile label='Правильных ответов' value={stats.correctAttempts} />
			<StatTile label='Всего попыток' value={stats.totalAttempts} />
			<StatTile label='Серия дней' value={stats.streak} />
			<StatTile label='Тем затронуто' value={stats.totalTasks} />
			{stats.lastActivityAt ? (
				<StatTile
					label='Последняя активность'
					value={new Date(stats.lastActivityAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
				/>
			) : (
				<StatTile label='Последняя активность' value='—' />
			)}
		</div>
	);
}

function WeakTasksList({ tasks }: { tasks: WeakTask[] }) {
	if (tasks.length === 0) {
		return <p className='text-sm text-muted-foreground'>Пока нет данных. Решай задачи, чтобы увидеть слабые темы.</p>;
	}
	return (
		<ul className='space-y-2'>
			{tasks.map(task => (
				<li key={String(task.taskId)} className='flex items-center justify-between gap-4 text-sm'>
					<AppLink to={`/tasks/${task.taskSlug}`} className='hover:underline truncate'>
						{task.egeNumber}. {task.taskTitle}
					</AppLink>
					<span className='shrink-0 text-muted-foreground tabular-nums'>
						{(task.accuracy * 100).toFixed(0)}% ({task.solvedCount}/{task.totalCount})
					</span>
				</li>
			))}
		</ul>
	);
}

function ActivityBar({ activity }: { activity: RecentActivity[] }) {
	if (activity.length === 0) {
		return <p className='text-sm text-muted-foreground'>Нет активности за последние 30 дней.</p>;
	}
	const max = Math.max(...activity.map(a => a.count), 1);
	return (
		<div className='flex items-end gap-1 h-16'>
			{activity.map(({ date, count }) => (
				<div key={date} title={`${date}: ${count}`} className='flex-1 flex flex-col items-center justify-end'>
					<div
						className='w-full rounded-t-sm bg-primary/70 transition-all'
						style={{ height: `${Math.max(2, Math.round((count / max) * 56))}px` }}
					/>
				</div>
			))}
		</div>
	);
}

function DeleteAccountModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: () => void; isPending: boolean }) {
	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-labelledby='delete-dialog-title'
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'
			onClick={e => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className='bg-background rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl'>
				<h2 id='delete-dialog-title' className='text-lg font-semibold text-destructive'>
					Удалить аккаунт?
				</h2>
				<p className='text-sm text-muted-foreground'>
					Это действие необратимо. Весь прогресс и данные будут удалены без возможности восстановления.
				</p>
				<div className='flex gap-3 justify-end'>
					<Button variant='outline' onClick={onClose} disabled={isPending}>
						Отмена
					</Button>
					<Button variant='destructive' onClick={onConfirm} disabled={isPending}>
						{isPending ? 'Удаление...' : 'Удалить аккаунт'}
					</Button>
				</div>
			</div>
		</div>
	);
}

function ProfileContent({ data, meData }: { data: ProfileMe; meData?: UserOut }) {
	const navigate = useNavigate();
	const deleteAccountMutation = useDeleteAccountMutation();
	const logoutMutation = useLogoutMutation();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		await deleteAccountMutation.mutateAsync();
		navigate('/', { replace: true });
	};

	const handleLogout = async () => {
		await logoutMutation.mutateAsync();
		navigate('/', { replace: true });
	};

	return (
		<div className='space-y-8'>
			<section aria-labelledby='stats-heading'>
				<h2 id='stats-heading' className='text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3'>
					Статистика
				</h2>
				<StatsGrid stats={data.stats} />
			</section>

			<section aria-labelledby='weak-heading'>
				<h2 id='weak-heading' className='text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3'>
					Слабые темы
				</h2>
				<WeakTasksList tasks={data.weakTasks} />
			</section>

			<section aria-labelledby='activity-heading'>
				<h2 id='activity-heading' className='text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3'>
					Активность за 30 дней
				</h2>
				<ActivityBar activity={data.recentActivity} />
			</section>

			<section aria-labelledby='account-heading' className='border-t border-border pt-6'>
				<h2 id='account-heading' className='text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3'>
					Аккаунт
				</h2>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
					<Button variant='outline' onClick={() => void handleLogout()} disabled={logoutMutation.isPending}>
						{logoutMutation.isPending ? 'Выход...' : 'Выйти'}
					</Button>
					<Button variant='destructive' onClick={() => setShowDeleteModal(true)}>
						Удалить аккаунт
					</Button>
				</div>
			</section>

			{showDeleteModal ? (
				<DeleteAccountModal
					onClose={() => setShowDeleteModal(false)}
					onConfirm={() => void handleDelete()}
					isPending={deleteAccountMutation.isPending}
				/>
			) : null}
		</div>
	);
}

export default function ProfilePage() {
	const { isAuthenticated } = useSessionSummary();
	const meQuery = useMe();
	const progressQuery = useProgressMeQuery();

	if (!isAuthenticated) {
		return (
			<main className='shell shell-narrow'>
				<section className='card space-y-4 text-center'>
					<h1 className='text-xl font-semibold'>Профиль</h1>
					<p className='text-sm text-muted-foreground'>Войди в аккаунт, чтобы видеть прогресс.</p>
					<Button asChild>
						<AppLink to='/login'>Войти</AppLink>
					</Button>
				</section>
			</main>
		);
	}

	return (
		<main className='shell'>
			<div className='max-w-2xl mx-auto space-y-6'>
				<header className='space-y-1'>
					<h1 className='text-2xl font-semibold tracking-tight'>Профиль</h1>
					{meQuery.data ? (
						<div className='flex flex-wrap items-center gap-2'>
							<p className='text-sm text-muted-foreground'>{meQuery.data.email}</p>
							{meQuery.data.role === 'admin' && (
								<span className='inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold'>
									Admin
								</span>
							)}
						</div>
					) : null}
				</header>

				{progressQuery.isLoading ? (
					<p className='text-sm text-muted-foreground'>Загрузка статистики...</p>
				) : progressQuery.isError ? (
					<p className='text-sm text-destructive'>Не удалось загрузить статистику.</p>
				) : progressQuery.data ? (
					<ProfileContent data={progressQuery.data} meData={meQuery.data} />
				) : null}
			</div>
		</main>
	);
}
