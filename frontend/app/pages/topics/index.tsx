import { useMemo, useState } from 'react';

import { listPublicTasks } from '@entities/task/api/tasks';
import type { CatalogFilters, PublicTaskSummary } from '@entities/task/model/task.types';
import { DifficultyChip } from '@entities/task/ui/difficulty-chip';
import { TaskFilterBar } from '@features/task-filters/task-filter-bar';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

type TopicsPageProps = {
	tasks: PublicTaskSummary[];
};

export function filterCatalogTasks(tasks: PublicTaskSummary[], filters: CatalogFilters): PublicTaskSummary[] {
	const query = filters.search.trim().toLocaleLowerCase('ru-RU');
	return tasks.filter(task => {
		if (filters.difficulty !== undefined && task.difficulty !== filters.difficulty) return false;
		if (query === '') return true;

		return [String(task.egeNumber), task.slug, task.title, task.summary ?? '']
			.join(' ')
			.toLocaleLowerCase('ru-RU')
			.includes(query);
	});
}

export async function loadTopicsPage(): Promise<{ tasks: PublicTaskSummary[] }> {
	return { tasks: await listPublicTasks() };
}

export default function TopicsPage({ tasks }: TopicsPageProps) {
	const [filters, setFilters] = useState<CatalogFilters>({ search: '' });
	const filteredTasks = useMemo(() => filterCatalogTasks(tasks, filters), [filters, tasks]);

	return (
		<main className='page-shell catalog-page'>
			<header className='catalog-heading'>
				<p className='kicker'>Каталог</p>
				<h1 className='serif page-title'>27 заданий ЕГЭ по информатике</h1>
				<p className='lede'>
					Выберите номер задания, откройте краткую теорию и переходите к тренировке. Прогресс появится здесь после
					входа.
				</p>
			</header>

			<TaskFilterBar filters={filters} onChange={setFilters} resultCount={filteredTasks.length} />

			{filteredTasks.length === 0 ? (
				<section className='empty-state'>
					<h2>Ничего не найдено</h2>
					<p>Попробуйте изменить поисковый запрос или сбросить фильтр сложности.</p>
				</section>
			) : (
				<section className='catalog-grid' aria-label='Список заданий'>
					{filteredTasks.map(task => (
						<article key={task.id} className='task-card'>
							<div className='task-card-main'>
								<div className='task-number mono'>{task.egeNumber}</div>
								<div>
									<div className='task-card-header'>
										<h2>{task.title}</h2>
										<DifficultyChip difficulty={task.difficulty} />
									</div>
									<p>{task.summary ?? 'Краткая теория и тренировочные задания.'}</p>
								</div>
							</div>
							<div className='task-card-meta'>
								<span>{task.estimatedMinutes ?? 10} мин</span>
								<span>{task.practiceCount} практик</span>
								<span>Прогресс: скоро</span>
							</div>
							<Button asChild variant='outline'>
								<AppLink to={`/tasks/${task.slug}`}>Открыть теорию</AppLink>
							</Button>
						</article>
					))}
				</section>
			)}
		</main>
	);
}
