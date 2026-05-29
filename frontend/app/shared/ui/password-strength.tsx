import { cn } from '@shared/lib/utils';

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const LABELS: Record<PasswordStrength, string> = {
	0: '',
	1: 'слабый',
	2: 'средний',
	3: 'хороший',
	4: 'надёжный',
};

const SEGMENT_COLORS: Record<number, string> = {
	0: 'bg-muted',
	1: 'bg-destructive',
	2: 'bg-yellow-500',
	3: 'bg-blue-500',
	4: 'bg-emerald-500',
};

export function computePasswordStrength(password: string): PasswordStrength {
	if (password.length === 0) return 0;
	let score = 0;
	if (password.length >= 8) score++;
	if (/[A-Z]/.test(password)) score++;
	if (/[0-9]/.test(password)) score++;
	if (/[^A-Za-z0-9]/.test(password)) score++;
	return score as PasswordStrength;
}

export function PasswordStrengthBar({ strength }: { strength: PasswordStrength }) {
	if (strength === 0) return null;

	const color = SEGMENT_COLORS[strength] ?? 'bg-muted';

	return (
		<div className='space-y-1'>
			<div className='flex gap-1'>
				{([1, 2, 3, 4] as const).map(level => (
					<div
						key={level}
						className={cn(
							'h-1 flex-1 rounded-full transition-colors',
							level <= strength ? color : 'bg-muted'
						)}
					/>
				))}
			</div>
			<p className={cn('text-xs', strength >= 3 ? 'text-emerald-600' : 'text-muted-foreground')}>
				{LABELS[strength]} · {strength}/4
			</p>
		</div>
	);
}
