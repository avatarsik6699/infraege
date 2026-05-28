import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPublicPractice, validatePracticeAnswer } from '@entities/practice/api/practice';
import { publicPracticeQueryOptions } from '@entities/practice/api/practice-queries';
import type { PracticeValidationResponse, PublicPracticeItem } from '@entities/practice/model/practice.types';
import { practiceQueryKeys } from '@shared/api/keys';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
	return new Response(JSON.stringify(body), { ...init, headers });
}

const practiceItem: PublicPracticeItem = {
	id: '22222222-2222-2222-2222-222222222222',
	taskId: '11111111-1111-1111-1111-111111111111',
	taskSlug: 'ege-01',
	taskTitle: 'Задание 1',
	egeNumber: 1,
	position: 1,
	year: 2024,
	promptHtml: '<p>Введите ответ</p>',
	codeBlock: null,
};

const validation: PracticeValidationResponse = {
	correct: true,
	expectedValue: '42',
	explanationHtml: '<p>Ответ 42</p>',
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

describe('practice API helpers', () => {
	beforeEach(() => {
		fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('fetches public practice by task id', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([practiceItem]));

		await expect(getPublicPractice(practiceItem.taskId)).resolves.toEqual([practiceItem]);

		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'http://localhost:8000/api/v1/public/practice/11111111-1111-1111-1111-111111111111'
		);
	});

	it('validates an answer without exposing raw answer in the URL', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(validation));

		await expect(validatePracticeAnswer({ itemId: practiceItem.id, answer: '42' })).resolves.toEqual(validation);

		expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8000/api/v1/public/validate');
		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(init.method).toBe('POST');
		expect(init.body).toBe(JSON.stringify({ itemId: practiceItem.id, answer: '42' }));
	});

	it('declares reusable practice query keys', () => {
		expect(practiceQueryKeys.publicPractice(practiceItem.taskId)).toEqual(['practice', 'public', practiceItem.taskId]);
		expect(publicPracticeQueryOptions(practiceItem.taskId).queryKey).toEqual([
			'practice',
			'public',
			practiceItem.taskId,
		]);
	});
});
