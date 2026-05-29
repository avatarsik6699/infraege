#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAllIndexableRoutes, buildRobotsTxt, buildSitemapXml, readSiteUrl } from './site-config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_TASKS_DIR = join(ROOT, '..', 'content', 'tasks');

function discoverTaskSlugs() {
	try {
		return readdirSync(CONTENT_TASKS_DIR)
			.filter(f => f.endsWith('.md'))
			.map(f => f.replace(/\.md$/, ''))
			.sort();
	} catch {
		return [];
	}
}

const outputDirs = [join(ROOT, 'public')];
const buildClientDir = join(ROOT, 'build', 'client');

if (existsSync(buildClientDir)) {
	outputDirs.push(buildClientDir);
}

const siteUrl = readSiteUrl();
const taskSlugs = discoverTaskSlugs();
const allRoutes = buildAllIndexableRoutes(taskSlugs);

const outputs = [
	['sitemap.xml', buildSitemapXml(siteUrl, allRoutes)],
	['robots.txt', buildRobotsTxt(siteUrl)],
];

for (const outputDir of outputDirs) {
	for (const [filename, content] of outputs) {
		const target = join(outputDir, filename);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, content);
	}
}

console.log(`Generated sitemap.xml and robots.txt for ${siteUrl} (${taskSlugs.length} task slugs).`);
