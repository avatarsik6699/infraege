import { describe, expect, it } from 'vitest';

import { normalizeSiteUrl } from '@shared/config/env';
import { buildRouteMeta, isPublicIndexableRoute } from '@shared/lib/seo';

describe('seo helpers', () => {
	it('builds indexable route metadata with canonical and social tags', () => {
		const meta = buildRouteMeta({
			pathname: '/',
			title: 'infraege',
			description: 'Подготовка к ЕГЭ по информатике: теория, практика и прогресс.',
			profile: 'publicIndexable',
		});

		expect(meta).toContainEqual({ title: 'infraege' });
		expect(meta).toContainEqual({ name: 'robots', content: 'index,follow' });
		expect(meta).toContainEqual({ tagName: 'link', rel: 'canonical', href: 'http://localhost:3000/' });
		expect(meta).toContainEqual({ property: 'og:title', content: 'infraege' });
		expect(meta).toContainEqual({ name: 'twitter:card', content: 'summary' });
	});

	it('marks private routes as noindex', () => {
		const meta = buildRouteMeta({
			pathname: '/dashboard',
			title: 'Dashboard',
			profile: 'privateNoIndex',
		});

		expect(meta).toContainEqual({ name: 'robots', content: 'noindex,nofollow' });
		expect(meta).toContainEqual({ tagName: 'link', rel: 'canonical', href: 'http://localhost:3000/dashboard' });
	});

	it('keeps only explicit public routes indexable', () => {
		expect(isPublicIndexableRoute('/')).toBe(true);
		expect(isPublicIndexableRoute('/topics')).toBe(true);
		expect(isPublicIndexableRoute('/privacy')).toBe(true);
		expect(isPublicIndexableRoute('/terms')).toBe(true);
		expect(isPublicIndexableRoute('/login')).toBe(false);
		expect(isPublicIndexableRoute('/register')).toBe(false);
		expect(isPublicIndexableRoute('/dashboard')).toBe(false);
	});

	it('normalizes public site URLs', () => {
		expect(normalizeSiteUrl('https://example.com/')).toBe('https://example.com');
		expect(normalizeSiteUrl('https://example.com/app/?x=1#section')).toBe('https://example.com/app');
		expect(() => normalizeSiteUrl('not a url')).toThrow('Invalid site URL value');
	});
});
