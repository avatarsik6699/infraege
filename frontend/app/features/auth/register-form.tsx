import type { FormEvent } from 'react';
import { useState } from 'react';

import { useProgressSync } from '@features/progress-sync/use-progress-sync';
import { useRegisterMutation } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { PasswordInput } from '@shared/ui/password-input';
import { computePasswordStrength, PasswordStrengthBar } from '@shared/ui/password-strength';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
	const router = useRouter();
	const registerMutation = useRegisterMutation();
	const { triggerSync } = useProgressSync();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [consent, setConsent] = useState(false);
	const [consentError, setConsentError] = useState(false);

	const strength = computePasswordStrength(password);

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (!consent) {
			setConsentError(true);
			return;
		}
		setConsentError(false);
		await registerMutation.mutateAsync({ email, password, consent_152fz: true });
		await triggerSync();
		if (onSuccess) {
			onSuccess();
		} else {
			router.navigate('/profile', { replace: true });
		}
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-email'>Email</Label>
				<Input
					id='register-email'
					type='email'
					autoComplete='email'
					value={email}
					onChange={event => setEmail(event.target.value)}
					required
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-password'>Пароль</Label>
				<PasswordInput
					id='register-password'
					autoComplete='new-password'
					value={password}
					onChange={event => setPassword(event.target.value)}
					minLength={8}
					required
				/>
				<PasswordStrengthBar strength={strength} />
			</div>
			<label className='flex items-start gap-2 text-sm cursor-pointer'>
				<input
					className='mt-0.5 rounded'
					type='checkbox'
					checked={consent}
					onChange={event => {
						setConsent(event.target.checked);
						if (event.target.checked) setConsentError(false);
					}}
				/>
				<span className='text-muted-foreground leading-snug'>
					Я согласен на обработку персональных данных по{' '}
					<AppLink to='/privacy' className='underline text-foreground'>
						152&#8209;ФЗ
					</AppLink>{' '}
					(
					<AppLink to='/terms' className='underline text-foreground'>
						условия
					</AppLink>
					)
				</span>
			</label>
			{consentError ? (
				<p className='text-sm text-destructive'>Согласие обязательно для создания аккаунта.</p>
			) : null}
			{registerMutation.isError ? (
				<p className='text-sm text-destructive'>Не удалось создать аккаунт. Попробуй снова.</p>
			) : null}
			<Button type='submit' disabled={registerMutation.isPending} className='w-full'>
				{registerMutation.isPending ? 'Создание...' : 'Создать аккаунт'}
			</Button>
			<Button asChild type='button' variant='outline' className='w-full'>
				<AppLink to='/topics'>Продолжить как гость</AppLink>
			</Button>
			<p className='text-center text-sm text-muted-foreground'>
				Уже есть аккаунт?{' '}
				<AppLink to='/login' className='font-medium text-foreground hover:underline'>
					Войти
				</AppLink>
			</p>
		</form>
	);
}
