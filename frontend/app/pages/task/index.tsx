import { BookOpen, Play } from 'lucide-react';

import { getPublicTask } from '@entities/task/api/tasks';
import type { PublicTaskDetail } from '@entities/task/model/task.types';
import { DifficultyChip } from '@entities/task/ui/difficulty-chip';
import { ApiError } from '@shared/api/client';
import { sanitizeTheoryHtml } from '@shared/lib/sanitize';
import { buildRouteMeta, buildTaskMeta } from '@shared/lib/seo';
import { isNonEmptyString } from '@shared/lib/type-guards';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

type TaskPageProps = {
	task: PublicTaskDetail;
};

export type TaskRouteData = {
	task: PublicTaskDetail;
};

export function taskRouteMeta(data?: TaskRouteData) {
	if (data?.task !== undefined) {
		return buildTaskMeta({
			slug: data.task.slug,
			title: data.task.title,
			description: data.task.summary,
		});
	}

	return buildRouteMeta({
		pathname: '/tasks',
		title: 'Теория',
		description: 'Страница теории по заданию ЕГЭ.',
		profile: 'publicNoIndex',
	});
}

export async function loadTaskPage(params: { slug?: string }): Promise<TaskRouteData> {
	if (!isNonEmptyString(params.slug)) {
		throw new Response('Task slug is required', { status: 400 });
	}

	try {
		return { task: await getPublicTask(params.slug) };
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) {
			throw new Response('Task not found', { status: 404 });
		}
		throw error;
	}
}

export default function TaskPage({ task }: TaskPageProps) {
	const primaryPractice = task.practice[0];
	const sanitizedTheory = sanitizeTheoryHtml(task.theoryHtml);
	const hasPrimaryPractice = primaryPractice !== undefined;

	return (
		<main className='page-shell theory-page'>
			<header className='theory-hero'>
				<div>
					<p className='kicker'>Задание {task.egeNumber}</p>
					<h1 className='serif page-title'>{task.title}</h1>
					<p className='lede'>{task.summary ?? 'Краткая теория, примеры и переход к практике.'}</p>
				</div>
				<div className='theory-actions'>
					<DifficultyChip difficulty={task.difficulty} />
					<span>{task.estimatedMinutes ?? 10} мин</span>
					{hasPrimaryPractice ? (
						<Button asChild>
							<AppLink to={`/practice/${primaryPractice.id}`}>
								<Play aria-hidden='true' className='size-4' />К практике
							</AppLink>
						</Button>
					) : null}
				</div>
			</header>

			<div className='theory-layout'>
				<aside className='theory-sidebar' aria-label='Оглавление'>
					<div className='sidebar-block'>
						<h2>
							<BookOpen aria-hidden='true' className='size-4' />
							Теория
						</h2>
						<nav>
							{task.theoryToc.length === 0 ? (
								<span>Оглавление появится после импорта.</span>
							) : (
								task.theoryToc.map(item => (
									<a key={item.id} href={`#${item.id}`} data-depth={item.depth}>
										{item.title}
									</a>
								))
							)}
						</nav>
					</div>
					<div className='sidebar-block'>
						<h2>Практика</h2>
						<p>{task.practice.length} заданий для тренировки</p>
						{hasPrimaryPractice ? (
							<Button asChild variant='outline'>
								<AppLink to={`/practice/${primaryPractice.id}`}>Начать с первого</AppLink>
							</Button>
						) : null}
					</div>
				</aside>

				<article className='theory-content'>
					<div dangerouslySetInnerHTML={{ __html: sanitizedTheory }} />
				</article>
			</div>
		</main>
	);
}
