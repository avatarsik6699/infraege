const featureFlagDefaults = {
	templateDiagnostics: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlagDefaults;
type FeatureFlagOverrides = Partial<Record<FeatureFlagKey, boolean>>;

function isEnabled(key: FeatureFlagKey, overrides: FeatureFlagOverrides = {}): boolean {
	return overrides[key] ?? featureFlagDefaults[key];
}

export const featureFlags = {
	isEnabled,
} as const;
