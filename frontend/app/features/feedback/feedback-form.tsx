import type { FormEvent } from 'react';
import { useId, useState } from 'react';

import { useFeedback } from '@features/feedback/use-feedback';
import { Button } from '@shared/ui/button';
import { Label } from '@shared/ui/label';

type FeedbackFormProps = {
	pageUrl?: string;
};

export function FeedbackForm({ pageUrl }: FeedbackFormProps) {
	const formId = useId();
	const [message, setMessage] = useState('');
	const { state, submit, reset } = useFeedback();

	const currentUrl = pageUrl ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submit(currentUrl, message);
		setMessage('');
	}

	if (state.phase === 'success') {
		return (
			<div role='status' aria-live='polite' className='rounded-xl border border-border bg-card p-6 text-center'>
				<p className='font-medium text-foreground'>Спасибо за обратную связь!</p>
				<p className='mt-1 text-sm text-muted-foreground'>Мы учтём ваш отзыв.</p>
				<Button variant='ghost' size='sm' className='mt-4' onClick={reset}>
					Отправить ещё
				</Button>
			</div>
		);
	}

	return (
		<form
			id={`feedback-form-${formId}`}
			aria-label='Форма обратной связи'
			className='grid gap-4'
			onSubmit={handleSubmit}
		>
			{/* honeypot — hidden from real users, must stay empty */}
			<input
				type='text'
				name='url'
				aria-hidden='true'
				tabIndex={-1}
				autoComplete='off'
				className='hidden'
				defaultValue=''
			/>

			<div className='grid gap-1.5'>
				<Label htmlFor={`feedback-message-${formId}`}>Ваш отзыв</Label>
				<textarea
					id={`feedback-message-${formId}`}
					name='message'
					rows={4}
					maxLength={5000}
					required
					value={message}
					onChange={e => setMessage(e.target.value)}
					placeholder='Расскажите, что можно улучшить...'
					aria-describedby={state.phase === 'error' ? `feedback-error-${formId}` : undefined}
					aria-invalid={state.phase === 'error' || undefined}
					className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring resize-y min-h-[100px] disabled:opacity-50'
					disabled={state.phase === 'loading'}
				/>
			</div>

			{state.phase === 'error' ? (
				<p id={`feedback-error-${formId}`} role='alert' className='text-sm text-destructive'>
					{state.message}
				</p>
			) : null}

			<Button
				type='submit'
				disabled={state.phase === 'loading' || message.trim().length === 0}
				className='w-full sm:w-auto'
			>
				{state.phase === 'loading' ? 'Отправка...' : 'Отправить'}
			</Button>
		</form>
	);
}
