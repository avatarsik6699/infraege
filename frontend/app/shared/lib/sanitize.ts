import { isNonEmptyString, isNonNil } from '@shared/lib/type-guards';

/**
 * Allowlist-based sanitizer for the small subset of HTML emitted by the Phase 02
 * Markdown sync (`<h1>`, `<h2>`, `<p>`, `<strong>`, plus `<img>` for diagrams).
 *
 * The backend already escapes user input before mounting allowlisted tags, but
 * we re-strip on the client to make the contract explicit: any handler that
 * pipes server HTML into `dangerouslySetInnerHTML` MUST go through this
 * function. Replace with DOMPurify if richer markup is ever needed.
 */
const ALLOWED_TAGS = new Set(['h1', 'h2', 'h3', 'p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'br', 'img']);
const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
	h1: new Set(['id']),
	h2: new Set(['id']),
	h3: new Set(['id']),
	img: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
};

const TAG_REGEX = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
const SCRIPT_REGEX = /<script[\s\S]*?<\/script>/gi;
const STYLE_REGEX = /<style[\s\S]*?<\/style>/gi;
const EVENT_HANDLER_REGEX = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi;

export function sanitizeTheoryHtml(input: string): string {
	if (!isNonEmptyString(input)) {
		return '';
	}

	let cleaned = input.replace(SCRIPT_REGEX, '').replace(STYLE_REGEX, '');
	cleaned = cleaned.replace(EVENT_HANDLER_REGEX, '');

	cleaned = cleaned.replace(TAG_REGEX, (match, rawName: string, rest: string) => {
		const tag = rawName.toLowerCase();
		if (!ALLOWED_TAGS.has(tag)) {
			return '';
		}

		if (match.startsWith('</')) {
			return `</${tag}>`;
		}

		const allowedAttrs = ALLOWED_ATTRS_BY_TAG[tag];
		if (!isNonNil(allowedAttrs)) {
			return `<${tag}>`;
		}

		const attributes = (rest.match(/\s([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g) ?? []).filter(attr => {
			const name = attr.trim().split('=')[0]?.toLowerCase() ?? '';
			return allowedAttrs.has(name);
		});

		return `<${tag}${attributes.join('')}>`;
	});

	return cleaned;
}
