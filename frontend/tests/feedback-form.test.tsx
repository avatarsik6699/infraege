import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { FeedbackForm } from '@features/feedback/feedback-form';

function renderFeedbackForm(): string {
	const router = createMemoryRouter([{ path: '/', element: <FeedbackForm pageUrl='/topics' /> }]);
	return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe('FeedbackForm', () => {
	it('renders textarea and submit button', () => {
		const html = renderFeedbackForm();
		expect(html).toContain('feedback-message');
		expect(html).toContain('Ваш отзыв');
		expect(html).toContain('Отправить');
	});

	it('renders honeypot field as hidden', () => {
		const html = renderFeedbackForm();
		expect(html).toContain('hidden');
		expect(html).toContain('aria-hidden');
	});

	it('includes accessible form label', () => {
		const html = renderFeedbackForm();
		expect(html).toContain('Форма обратной связи');
	});

	it('textarea has correct maxLength', () => {
		const html = renderFeedbackForm();
		// React SSR renders prop names as-is (camelCase) in static markup
		expect(html).toContain('maxLength="5000"');
	});
});
