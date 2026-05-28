import type { AppErrorTypes } from '@shared/lib/app-error';
import { isNonEmptyString, isNonNil } from '@shared/lib/type-guards';
import { Button } from '@shared/ui/button';

type ErrorStateProps = {
	title: string;
	error: AppErrorTypes.AppUiError;
	retryLabel?: string;
	onRetry?: () => void;
	secondaryActionLabel?: string;
	onSecondaryAction?: () => void;
};

export function ErrorState({
	title,
	error,
	retryLabel,
	onRetry,
	secondaryActionLabel,
	onSecondaryAction,
}: ErrorStateProps) {
	const resolvedRetryLabel = retryLabel ?? 'Повторить';

	return (
		<section className='card space-y-4' role='alert' aria-live='assertive'>
			<h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
			<p className='text-sm text-muted-foreground'>{error.message}</p>
			{isNonEmptyString(error.requestId) ? (
				<p className='text-xs text-muted-foreground'>ID запроса: {error.requestId}</p>
			) : null}
			{isNonEmptyString(error.technicalDetails) ? (
				<pre className='overflow-auto rounded-md border p-3 text-xs'>{error.technicalDetails}</pre>
			) : null}
			<div className='flex flex-wrap gap-2'>
				{isNonNil(onRetry) && error.canRetry ? (
					<Button type='button' onClick={onRetry}>
						{resolvedRetryLabel}
					</Button>
				) : null}
				{isNonNil(onSecondaryAction) && isNonEmptyString(secondaryActionLabel) ? (
					<Button type='button' variant='outline' onClick={onSecondaryAction}>
						{secondaryActionLabel}
					</Button>
				) : null}
			</div>
		</section>
	);
}
