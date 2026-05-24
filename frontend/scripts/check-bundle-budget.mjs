#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BUILD_DIR = join(ROOT, 'build');
const MAX_BUILD_BYTES = 5 * 1024 * 1024;

function sizeOf(path) {
	const stat = statSync(path);
	if (stat.isDirectory()) {
		return readdirSync(path).reduce((total, entry) => total + sizeOf(join(path, entry)), 0);
	}
	return stat.size;
}

try {
	const size = sizeOf(BUILD_DIR);
	if (size > MAX_BUILD_BYTES) {
		console.error(`Bundle budget FAIL: build is ${size} bytes, limit is ${MAX_BUILD_BYTES} bytes.`);
		process.exit(1);
	}
	console.log(`Bundle budget: ${size} bytes / ${MAX_BUILD_BYTES} bytes.`);
} catch {
	console.log('Bundle budget: no build directory, skipping.');
}
