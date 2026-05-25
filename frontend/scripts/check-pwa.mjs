#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const clientDir = join(ROOT, 'build', 'client');
const manifestPath = join(clientDir, 'manifest.webmanifest');
const serviceWorkerPath = join(clientDir, 'sw.js');

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

assert(existsSync(manifestPath), 'PWA check failed: manifest.webmanifest is missing.');
assert(existsSync(serviceWorkerPath), 'PWA check failed: sw.js is missing.');
assert(existsSync(join(clientDir, 'pwa-icon.svg')), 'PWA check failed: pwa-icon.svg is missing.');
assert(existsSync(join(clientDir, 'pwa-maskable-icon.svg')), 'PWA check failed: pwa-maskable-icon.svg is missing.');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const serviceWorker = readFileSync(serviceWorkerPath, 'utf8');

assert(manifest.name, 'PWA check failed: manifest name is missing.');
assert(manifest.short_name, 'PWA check failed: manifest short_name is missing.');
assert(manifest.display === 'standalone', 'PWA check failed: manifest display must be standalone.');
assert(manifest.start_url === '/', 'PWA check failed: manifest start_url must be /.');
assert(manifest.scope === '/', 'PWA check failed: manifest scope must be /.');
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'PWA check failed: manifest icons are missing.');
assert(
	manifest.icons.some(icon => String(icon.purpose ?? '').includes('maskable')),
	'PWA check failed: manifest maskable icon is missing.'
);
assert(!serviceWorker.includes('url:"assets/auth-'), 'PWA check failed: service worker should not precache auth chunks.');
assert(!serviceWorker.includes('url:"assets/login-'), 'PWA check failed: service worker should not precache login chunks.');
assert(!serviceWorker.includes('url:"assets/register-'), 'PWA check failed: service worker should not precache register chunks.');
assert(!serviceWorker.includes('url:"assets/dashboard-'), 'PWA check failed: service worker should not precache dashboard chunks.');

console.log('PWA check passed.');
