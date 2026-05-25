export type RandomSource = () => number;

function randomFloat(source: RandomSource = Math.random): number {
	const value = source();
	if (!Number.isFinite(value) || value < 0 || value >= 1) {
		throw new Error('Random source must return a finite number in the [0, 1) range');
	}

	return value;
}

export const random = {
	randomFloat,
} as const;
