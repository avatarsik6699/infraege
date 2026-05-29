import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NavigationProgressView } from '@shared/ui/navigation-progress';

describe('NavigationProgressView', () => {
	it('is hidden for idle navigation', () => {
		const html = renderToStaticMarkup(<NavigationProgressView isVisible={false} value={0} />);
		expect(html).toBe('');
	});

	it('renders progressbar for pending navigation', () => {
		const html = renderToStaticMarkup(<NavigationProgressView isVisible value={78} />);
		expect(html).toContain('Загрузка страницы');
		expect(html).toContain('role="progressbar"');
		expect(html).toContain('aria-valuenow="78"');
	});
});
