import { browser } from '@shared/lib/browser';
import { isNonNil } from '@shared/lib/type-guards';

async function writeText(value: string): Promise<boolean> {
	const clipboard = browser.getNavigator()?.clipboard;
	if (!isNonNil(clipboard)) {
		return false;
	}

	try {
		await clipboard.writeText(value);
		return true;
	} catch {
		return false;
	}
}

export const clipboard = {
	writeText,
} as const;
