import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { PublicTaskDetail, PublicTaskSummary } from '@entities/task/model/task.types';
import HomePage from '@pages/home';
import TaskPage from '@pages/task';
import TopicsPage, { filterCatalogTasks } from '@pages/topics';
import { buildTaskMeta } from '@shared/lib/seo';

const tasks: PublicTaskSummary[] = [
	{
		id: '11111111-1111-1111-1111-111111111111',
		egeNumber: 1,
		slug: 'ege-01',
		title: 'Задание 1',
		summary: 'Графы и таблицы',
		difficulty: 'basic',
		estimatedMinutes: 5,
		practiceCount: 1,
		publishedAt: null,
	},
	{
		id: '22222222-2222-2222-2222-222222222222',
		egeNumber: 27,
		slug: 'ege-27',
		title: 'Задание 27',
		summary: 'Динамическое программирование',
		difficulty: 'high',
		estimatedMinutes: 45,
		practiceCount: 2,
		publishedAt: null,
	},
];

const detail: PublicTaskDetail = {
	...tasks[0],
	theoryHtml: '<h1 id="task-1">Задание 1</h1><script>alert(1)</script><p>Теория</p>',
	theoryToc: [{ id: 'task-1', title: 'Задание 1', depth: 1 }],
	assetManifest: [],
	metadata: {},
	practice: [{ id: '33333333-3333-3333-3333-333333333333', taskId: tasks[0].id, position: 1, year: 2024 }],
};

function renderWithRouter(element: React.ReactElement): string {
	return renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
}

describe('public task routes UI', () => {
	it('renders home links to catalog and trainer entry points', () => {
		const html = renderWithRouter(<HomePage />);
		expect(html).toContain('Каталог заданий');
		expect(html).toContain('/topics');
		expect(html).toContain('/practice/demo');
	});

	it('filters catalog tasks by Russian search and difficulty', () => {
		expect(filterCatalogTasks(tasks, { search: 'динамическое' }).map(task => task.slug)).toEqual(['ege-27']);
		expect(filterCatalogTasks(tasks, { search: '', difficulty: 'basic' }).map(task => task.slug)).toEqual(['ege-01']);
	});

	it('renders catalog cards with progress placeholders', () => {
		const html = renderWithRouter(<TopicsPage tasks={tasks} />);
		expect(html).toContain('27 заданий ЕГЭ');
		expect(html).toContain('/tasks/ege-01');
		expect(html).toContain('Прогресс: скоро');
	});

	it('renders sanitized theory content and practice CTA', () => {
		const html = renderWithRouter(<TaskPage task={detail} />);
		expect(html).toContain('Задание 1');
		expect(html).toContain('href="#task-1"');
		expect(html).toContain('/practice/33333333-3333-3333-3333-333333333333');
		expect(html).not.toContain('<script>');
	});

	it('builds canonical metadata for task pages', () => {
		const meta = buildTaskMeta({ slug: 'ege-01', title: 'Задание 1', description: 'Графы' });
		expect(meta).toContainEqual({ tagName: 'link', rel: 'canonical', href: 'http://localhost:3000/tasks/ege-01' });
		expect(meta).toContainEqual({ name: 'robots', content: 'index,follow' });
	});
});
