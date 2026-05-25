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
});
