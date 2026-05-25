export const defaultSiteUrl = 'http://localhost:3000';
export const defaultAppName = 'Template App';
export const publicIndexableRoutes = ['/'];

export function normalizeSiteUrl(value) {
	try {
		const url = new URL(value);
		url.hash = '';
		url.search = '';
		url.pathname = url.pathname.replace(/\/+$/, '');
		return url.toString().replace(/\/$/, '');
	} catch {
		throw new Error(`Invalid site URL value: ${value}`);
	}
}

export function readSiteUrl(env = process.env) {
	const configuredSiteUrl = env.VITE_PUBLIC_SITE_URL?.trim();
	const siteUrl = configuredSiteUrl || defaultSiteUrl;
	return normalizeSiteUrl(siteUrl);
}

export function readAppName(env = process.env) {
	return env.VITE_PUBLIC_APP_NAME?.trim() || defaultAppName;
}

export function canonicalUrl(siteUrl, pathname) {
	const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return `${siteUrl}${normalizedPathname === '/' ? '/' : normalizedPathname}`;
}

export function buildSitemapXml(siteUrl, routes = publicIndexableRoutes) {
	const urls = routes.map(
		route => `\t<url>\n\t\t<loc>${canonicalUrl(siteUrl, route)}</loc>\n\t</url>`
	);

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function buildRobotsTxt(siteUrl) {
	return `User-agent: *\nAllow: /\nSitemap: ${canonicalUrl(siteUrl, '/sitemap.xml')}\n`;
}
