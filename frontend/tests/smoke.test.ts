import { describe, expect, it } from 'vitest';

import routes from '../app/routes';

describe('smoke', () => {
	it('runs tests', () => {
		expect(true).toBe(true);
	});

	it('declares phase 01 route placeholders', () => {
		expect(JSON.stringify(routes)).toContain('topics');
		expect(JSON.stringify(routes)).toContain('tasks/:slug');
		expect(JSON.stringify(routes)).toContain('practice/:id');
		expect(JSON.stringify(routes)).toContain('profile');
		expect(JSON.stringify(routes)).toContain('privacy');
		expect(JSON.stringify(routes)).toContain('terms');
		expect(JSON.stringify(routes)).toContain('admin/feedback');
		expect(JSON.stringify(routes)).toContain('admin/status');
		expect(JSON.stringify(routes)).toContain('admin/analytics');
	});
});
