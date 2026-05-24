#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const E2E_DIR = join(ROOT, 'tests', 'e2e');

const BANNED = [
	{ pattern: /\.waitForTimeout\s*\(/, name: 'waitForTimeout: use locator auto-waiting instead' },
	{ pattern: /page\.pause\s*\(/, name: 'page.pause: must not be committed' },
	{ pattern: /\.waitForNavigation\s*\(/, name: 'waitForNavigation: use waitForURL instead' },
	{ pattern: /setTimeout\s*\(/, name: 'setTimeout in test body: use Playwright assertions' },
];

function collectSpecs(dir) {
	let files = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			files = files.concat(collectSpecs(full));
		} else if (/\.spec\.[jt]s$/.test(entry)) {
			files.push(full);
		}
	}
	return files;
}

let specs;
try {
	specs = collectSpecs(E2E_DIR);
} catch {
	console.log('E2E lint: no tests/e2e directory, skipping.');
	process.exit(0);
}

if (specs.length === 0) {
	console.log('E2E lint: no spec files found, skipping.');
	process.exit(0);
}

let violations = 0;
for (const file of specs) {
	const lines = readFileSync(file, 'utf8').split('\n');
	for (let i = 0; i < lines.length; i++) {
		for (const rule of BANNED) {
			if (rule.pattern.test(lines[i])) {
				console.error(`${file}:${i + 1}  banned: ${rule.name}`);
				violations++;
			}
		}
	}
}

if (violations > 0) {
	console.error(`\nE2E lint FAIL: ${violations} violation(s).`);
	process.exit(1);
}

console.log(`E2E lint: clean (${specs.length} spec file(s) checked).`);
