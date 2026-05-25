#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readAppName, readSiteUrl } from './site-config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const appName = readAppName();
const siteUrl = readSiteUrl();
const indexHtmlPath = join(ROOT, 'build', 'client', 'index.html');
const sitemapPath = join(ROOT, 'build', 'client', 'sitemap.xml');
const robotsPath = join(ROOT, 'build', 'client', 'robots.txt');

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

assert(existsSync(indexHtmlPath), 'SEO check failed: build/client/index.html is missing.');
assert(existsSync(sitemapPath), 'SEO check failed: build/client/sitemap.xml is missing.');
assert(existsSync(robotsPath), 'SEO check failed: build/client/robots.txt is missing.');

const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const sitemap = readFileSync(sitemapPath, 'utf8');
const robots = readFileSync(robotsPath, 'utf8');

assert(indexHtml.includes(`<title>${appName}</title>`), 'SEO check failed: home title is missing.');
assert(indexHtml.includes('name="description"'), 'SEO check failed: home description is missing.');
assert(indexHtml.includes('rel="canonical"'), 'SEO check failed: canonical link is missing.');
assert(indexHtml.includes('property="og:title"'), 'SEO check failed: Open Graph title is missing.');
assert(sitemap.includes(`<loc>${siteUrl}/</loc>`), 'SEO check failed: sitemap does not include home URL.');
assert(!sitemap.includes('/login'), 'SEO check failed: sitemap includes /login.');
assert(!sitemap.includes('/register'), 'SEO check failed: sitemap includes /register.');
assert(!sitemap.includes('/dashboard'), 'SEO check failed: sitemap includes /dashboard.');
assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'SEO check failed: robots.txt sitemap URL is missing.');

console.log('SEO check passed.');
