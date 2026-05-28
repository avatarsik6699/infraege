import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { publicTaskCatalogQueryOptions, publicTaskDetailQueryOptions } from '@entities/task/api/task-queries';
import { getPublicTask, listPublicTasks } from '@entities/task/api/tasks';
import type { PublicTaskDetail, PublicTaskSummary } from '@entities/task/model/task.types';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
	return new Response(JSON.stringify(body), { ...init, headers });
}

const summary: PublicTaskSummary = {
	id: '11111111-1111-1111-1111-111111111111',
	egeNumber: 1,
	slug: 'ege-01',
	title: 'Задание 1',
	summary: 'Графы',
	difficulty: 'basic',
	estimatedMinutes: 5,
	practiceCount: 1,
	publishedAt: null,
};

const detail: PublicTaskDetail = {
	...summary,
	theoryHtml: '<h1 id="task-1">Задание 1</h1>',
	theoryToc: [{ id: 'task-1', title: 'Задание 1', depth: 1 }],
	assetManifest: [],
	metadata: {},
	practice: [{ id: '22222222-2222-2222-2222-222222222222', taskId: summary.id, position: 1, year: 2024 }],
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

describe('task API helpers', () => {
	beforeEach(() => {
		fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('fetches public task catalog with filters', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([summary]));

		await expect(listPublicTasks({ search: 'граф', difficulty: 'basic' })).resolves.toEqual([summary]);

		const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
		expect(url.toString()).toBe(
			'http://localhost:8000/api/v1/public/tasks?search=%D0%B3%D1%80%D0%B0%D1%84&difficulty=basic'
		);
	});

	it('fetches public task detail by slug', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(detail));

		await expect(getPublicTask('ege-01')).resolves.toEqual(detail);

		expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8000/api/v1/public/tasks/ege-01');
	});

	it('declares reusable task query options', () => {
		expect(publicTaskCatalogQueryOptions({ difficulty: 'high' }).queryKey).toEqual([
			'tasks',
			'public',
			'catalog',
			{ difficulty: 'high' },
		]);
		expect(publicTaskDetailQueryOptions('ege-27').queryKey).toEqual(['tasks', 'public', 'detail', 'ege-27']);
	});
});
