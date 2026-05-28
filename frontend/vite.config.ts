import { fileURLToPath, URL } from 'node:url';

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function readPublicAppName(): string {
	const value = process.env.VITE_PUBLIC_APP_NAME?.trim();
	return value !== undefined && value.length > 0 ? value : 'infraege';
}

function readPublicSiteUrl(command: string, mode: string): string {
	const value = process.env.VITE_PUBLIC_SITE_URL?.trim();
	if (command === 'build' && mode === 'production' && (value === undefined || value.length === 0)) {
		throw new Error('VITE_PUBLIC_SITE_URL is required for production builds');
	}

	return value !== undefined && value.length > 0 ? value : 'http://localhost:3000';
}

export default defineConfig(({ command, mode }) => {
	const appName = readPublicAppName();
	readPublicSiteUrl(command, mode);

	return {
		plugins: [
			reactRouter(),
			tailwindcss(),
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: null,
				includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pwa-maskable-icon.svg'],
				manifest: {
					name: appName,
					short_name: appName,
					description: 'Подготовка к ЕГЭ по информатике: теория, практика и прогресс.',
					theme_color: '#fbfaf7',
					background_color: '#fbfaf7',
					display: 'standalone',
					scope: '/',
					start_url: '/',
					icons: [
						{
							src: '/pwa-icon.svg',
							sizes: 'any',
							type: 'image/svg+xml',
							purpose: 'any',
						},
						{
							src: '/pwa-maskable-icon.svg',
							sizes: 'any',
							type: 'image/svg+xml',
							purpose: 'maskable',
						},
					],
				},
				workbox: {
					cleanupOutdatedCaches: true,
					globPatterns: ['assets/**/*.{js,css,woff,woff2}', '*.{svg,ico,png,webmanifest}'],
					globIgnores: [
						'**/*.html',
						'sw.js',
						'workbox-*.js',
						'assets/auth-*.js',
						'assets/login-*.js',
						'assets/register-*.js',
						'assets/dashboard-*.js',
					],
					navigateFallbackDenylist: [/^\/api\//, /^\/login\/?$/, /^\/register\/?$/, /^\/dashboard\/?$/, /.*/],
				},
			}),
		],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./app', import.meta.url)),
				'@shared': fileURLToPath(new URL('./app/shared', import.meta.url)),
				'@entities': fileURLToPath(new URL('./app/entities', import.meta.url)),
				'@features': fileURLToPath(new URL('./app/features', import.meta.url)),
				'@widgets': fileURLToPath(new URL('./app/widgets', import.meta.url)),
				'@pages': fileURLToPath(new URL('./app/pages', import.meta.url)),
			},
		},
		server: {
			port: 3000,
			host: '0.0.0.0',
		},
	};
});
