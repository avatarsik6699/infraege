import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicPracticeItem } from '@entities/practice/model/practice.types';
import { guestProgressStore } from '@features/guest-progress/guest-progress-store';
import PracticePage from '@pages/practice';
import { practiceQueryKeys } from '@shared/api/keys';

class MemoryStorage implements Storage {
	private values = new Map<string, string>();

	get length(): number {
		return this.values.size;
	}

	clear(): void {
		this.values.clear();
	}

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

const taskId = '11111111-1111-1111-1111-111111111111';
const practiceItems: PublicPracticeItem[] = [
	{
		id: '22222222-2222-2222-2222-222222222222',
		taskId,
		taskSlug: 'ege-01',
		taskTitle: 'Задание 1',
		egeNumber: 1,
		position: 1,
		year: 2024,
		promptHtml: '<p>Введите ответ</p><script>alert(1)</script>',
		codeBlock: { language: 'python', title: 'demo.py', code: 'print(42)' },
	},
];

function renderPractice(queryClient: QueryClient): string {
	return renderToStaticMarkup(
		<MemoryRouter>
			<QueryClientProvider client={queryClient}>
				<PracticePage taskId={taskId} />
			</QueryClientProvider>
		</MemoryRouter>
	);
}

describe('practice route UI', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { localStorage: new MemoryStorage() });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders trainer loading state', () => {
		const html = renderPractice(new QueryClient());

		expect(html).toContain('Загружаем тренажер');
	});

	it('renders empty state when no practice items exist', () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(practiceQueryKeys.publicPractice(taskId), []);

		const html = renderPractice(queryClient);

		expect(html).toContain('Практика скоро появится');
		expect(html).toContain('/topics');
	});

	it('renders prompt, code block, local progress, and stable answer controls', () => {
		guestProgressStore.recordAttempt({
			itemId: practiceItems[0].id,
			taskId,
			answer: '42',
			isCorrect: true,
			answeredAt: '2026-05-28T10:00:00.000Z',
		});
		const queryClient = new QueryClient();
		queryClient.setQueryData(practiceQueryKeys.publicPractice(taskId), practiceItems);

		const html = renderPractice(queryClient);

		expect(html).toContain('Задание 1');
		expect(html).toContain('Введите ответ');
		expect(html).toContain('print(42)');
		expect(html).toContain('Решено 1 из 1');
		expect(html).toContain('Проверить');
		expect(html).not.toContain('<script>');
	});
});
