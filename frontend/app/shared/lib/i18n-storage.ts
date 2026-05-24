import { safeLs, type SafeLsTypes } from '@shared/lib/safe-ls';

const I18N_LANGUAGE_STORAGE: SafeLsTypes.Key<string> = {
	key: 'template_app.i18n.language',
	version: 1,
	guard: isLanguage,
};

function isLanguage(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

function read(): string | null {
	return safeLs.get(I18N_LANGUAGE_STORAGE);
}

function write(language: string): void {
	safeLs.set(I18N_LANGUAGE_STORAGE, language);
}

export const i18nStorage = {
	read,
	write,
} as const;
