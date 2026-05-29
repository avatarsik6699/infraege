import * as React from 'react';

import { cn } from '@shared/lib/utils';

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<'div'> & {
	value?: number | null;
}) {
	const normalizedValue = Math.max(0, Math.min(100, value ?? 0));

	return (
		<div
			data-slot='progress'
			role='progressbar'
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={normalizedValue}
			className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
			{...props}
		>
			<div
				data-slot='progress-indicator'
				className='h-full w-full flex-1 bg-primary transition-transform'
				style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
			/>
		</div>
	);
}

export { Progress };
