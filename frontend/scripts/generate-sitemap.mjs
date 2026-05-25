#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRobotsTxt, buildSitemapXml, readSiteUrl } from './site-config.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const outputDirs = [join(ROOT, 'public')];
const buildClientDir = join(ROOT, 'build', 'client');

if (existsSync(buildClientDir)) {
	outputDirs.push(buildClientDir);
}

const siteUrl = readSiteUrl();
const outputs = [
	['sitemap.xml', buildSitemapXml(siteUrl)],
	['robots.txt', buildRobotsTxt(siteUrl)],
];

for (const outputDir of outputDirs) {
	for (const [filename, content] of outputs) {
		const target = join(outputDir, filename);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, content);
	}
}

console.log(`Generated sitemap.xml and robots.txt for ${siteUrl}.`);
