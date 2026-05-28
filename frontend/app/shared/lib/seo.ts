import { env } from '@shared/config/env';
import { isNonEmptyString } from '@shared/lib/type-guards';

type SeoProfile = 'publicIndexable' | 'publicNoIndex' | 'privateNoIndex';

type MetaDescriptor =
	| { title: string }
	| { name: string; content: string }
	| { property: string; content: string }
	| { tagName: 'link'; rel: string; href: string };

type RouteSeoInput = {
	pathname: string;
	title?: string;
	description?: string;
	profile: SeoProfile;
};

const defaultDescription = 'Подготовка к ЕГЭ по информатике: теория, практика и прогресс.';
const noIndexContent = 'noindex,nofollow';

export const publicIndexableRoutes = ['/', '/topics', '/privacy', '/terms'] as const;

function joinUrl(baseUrl: string, pathname: string): string {
	const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return `${baseUrl}${normalizedPathname === '/' ? '/' : normalizedPathname}`;
}

function buildTitle(title?: string): string {
	if (!isNonEmptyString(title) || title === env.client.appName) {
		return env.client.appName;
	}

	return `${title} - ${env.client.appName}`;
}

function robotsForProfile(profile: SeoProfile): string {
	return profile === 'publicIndexable' ? 'index,follow' : noIndexContent;
}

export function buildRouteMeta(input: RouteSeoInput): MetaDescriptor[] {
	const title = buildTitle(input.title);
	const description = input.description ?? defaultDescription;
	const canonical = joinUrl(env.client.siteUrl, input.pathname);
	const robots = robotsForProfile(input.profile);

	return [
		{ title },
		{ name: 'description', content: description },
		{ name: 'robots', content: robots },
		{ tagName: 'link', rel: 'canonical', href: canonical },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:title', content: title },
		{ property: 'og:description', content: description },
		{ property: 'og:url', content: canonical },
		{ property: 'og:site_name', content: env.client.appName },
		{ name: 'twitter:card', content: 'summary' },
		{ name: 'twitter:title', content: title },
		{ name: 'twitter:description', content: description },
	];
}

export function isPublicIndexableRoute(pathname: string): boolean {
	return (
		publicIndexableRoutes.includes(pathname as (typeof publicIndexableRoutes)[number]) || pathname.startsWith('/tasks/')
	);
}

export function buildCatalogMeta(): MetaDescriptor[] {
	return buildRouteMeta({
		pathname: '/topics',
		title: 'Каталог заданий',
		description: 'Каталог опубликованных заданий ЕГЭ по информатике с теорией и переходом к практике.',
		profile: 'publicIndexable',
	});
}

export function buildTaskMeta(input: { slug: string; title: string; description?: string | null }): MetaDescriptor[] {
	return buildRouteMeta({
		pathname: `/tasks/${input.slug}`,
		title: input.title,
		description: input.description ?? 'Теория и практика по заданию ЕГЭ по информатике.',
		profile: 'publicIndexable',
	});
}
