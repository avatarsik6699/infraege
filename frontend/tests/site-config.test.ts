import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

function runSiteConfigExpression(expression: string): string {
	return execFileSync(
		process.execPath,
		[
			'--input-type=module',
			'--eval',
			`import * as site from './scripts/site-config.mjs'; console.log(JSON.stringify(${expression}));`,
		],
		{ cwd: process.cwd(), encoding: 'utf8' }
	).trim();
}

describe('site output generators', () => {
	it('builds sitemap with only public indexable routes', () => {
		const sitemap = JSON.parse(runSiteConfigExpression("site.buildSitemapXml('https://example.com')")) as string;

		expect(sitemap).toContain('<loc>https://example.com/</loc>');
		expect(sitemap).toContain('<loc>https://example.com/topics</loc>');
		expect(sitemap).toContain('<loc>https://example.com/privacy</loc>');
		expect(sitemap).toContain('<loc>https://example.com/terms</loc>');
		expect(sitemap).not.toContain('/login');
		expect(sitemap).not.toContain('/register');
		expect(sitemap).not.toContain('/dashboard');
	});

	it('builds robots.txt with sitemap URL', () => {
		const robots = JSON.parse(runSiteConfigExpression("site.buildRobotsTxt('https://example.com')")) as string;

		expect(robots).toContain('User-agent: *');
		expect(robots).toContain('Allow: /');
		expect(robots).toContain('Sitemap: https://example.com/sitemap.xml');
	});

	it('buildAllIndexableRoutes includes task slugs', () => {
		const routes = JSON.parse(
			runSiteConfigExpression("site.buildAllIndexableRoutes(['ege-01', 'ege-02', 'ege-27'])")
		) as string[];

		expect(routes).toContain('/');
		expect(routes).toContain('/topics');
		expect(routes).toContain('/privacy');
		expect(routes).toContain('/terms');
		expect(routes).toContain('/tasks/ege-01');
		expect(routes).toContain('/tasks/ege-02');
		expect(routes).toContain('/tasks/ege-27');
	});

	it('buildAllIndexableRoutes with no task slugs returns base routes', () => {
		const routes = JSON.parse(runSiteConfigExpression('site.buildAllIndexableRoutes()')) as string[];

		expect(routes).toEqual(['/', '/topics', '/privacy', '/terms']);
	});

	it('sitemap with task slugs contains task URLs', () => {
		const sitemap = JSON.parse(
			runSiteConfigExpression(
				"site.buildSitemapXml('https://infraege.ru', site.buildAllIndexableRoutes(['ege-01', 'ege-27']))"
			)
		) as string;

		expect(sitemap).toContain('<loc>https://infraege.ru/tasks/ege-01</loc>');
		expect(sitemap).toContain('<loc>https://infraege.ru/tasks/ege-27</loc>');
	});
});
