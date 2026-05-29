import * as React from 'react';

import { cn } from '@shared/lib/utils';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className='relative'>
			<input
				type={visible ? 'text' : 'password'}
				data-slot='input'
				className={cn(
					'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pr-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
					className
				)}
				{...props}
			/>
			<button
				type='button'
				aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
				onClick={() => setVisible(v => !v)}
				className='absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground'
				tabIndex={-1}
			>
				{visible ? (
					<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
						<path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
						<line x1='1' y1='1' x2='23' y2='23' />
					</svg>
				) : (
					<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
						<circle cx='12' cy='12' r='3' />
					</svg>
				)}
			</button>
		</div>
	);
}
