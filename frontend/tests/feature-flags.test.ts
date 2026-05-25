import { describe, expect, it } from 'vitest';

import { featureFlags } from '@shared/lib/feature-flags';

describe('featureFlags', () => {
	it('returns typed defaults and accepts typed overrides', () => {
		expect(featureFlags.isEnabled('templateDiagnostics')).toBe(false);
		expect(featureFlags.isEnabled('templateDiagnostics', { templateDiagnostics: true })).toBe(true);
	});
});
