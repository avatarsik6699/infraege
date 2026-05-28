import { useTheme } from 'next-themes';

import { Button } from '@shared/ui/button';

const themes = ['light', 'dark', 'system'] as const;
const themeLabels = {
	light: 'Светлая',
	dark: 'Темная',
	system: 'Системная',
} as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<div className='flex items-center gap-2'>
			<span className='text-xs text-muted-foreground'>Тема</span>
			<div className='inline-flex rounded-lg border border-border bg-background p-1'>
				{themes.map(value => (
					<Button
						key={value}
						type='button'
						size='xs'
						variant={theme === value ? 'default' : 'ghost'}
						onClick={() => setTheme(value)}
						className='capitalize'
					>
						{themeLabels[value]}
					</Button>
				))}
			</div>
		</div>
	);
}
