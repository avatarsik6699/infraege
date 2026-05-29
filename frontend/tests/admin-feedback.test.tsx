import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AdminFeedbackPage } from '@pages/admin/feedback';

vi.mock('@entities/feedback/api/feedback', () => ({
	listAdminFeedback: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20 }),
	patchFeedbackStatus: vi.fn().mockResolvedValue({}),
}));

function renderAdminFeedbackPage(): string {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const router = createMemoryRouter([
		{
			path: '/',
			element: (
				<QueryClientProvider client={queryClient}>
					<AdminFeedbackPage />
				</QueryClientProvider>
			),
		},
	]);
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe('AdminFeedbackPage', () => {
	it('renders page heading', () => {
		const html = renderAdminFeedbackPage();
		expect(html).toContain('Обратная связь');
	});

	it('renders status filter buttons', () => {
		const html = renderAdminFeedbackPage();
		expect(html).toContain('Все');
		expect(html).toContain('Новые');
		expect(html).toContain('Рассмотренные');
		expect(html).toContain('Архив');
	});

	it('shows loading state initially', () => {
		const html = renderAdminFeedbackPage();
		expect(html).toContain('Загрузка');
	});
});
