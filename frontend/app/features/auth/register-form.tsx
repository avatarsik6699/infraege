import type { FormEvent } from 'react';
import { useState } from 'react';

import { useRegisterMutation } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';

export function RegisterForm() {
	const router = useRouter();
	const registerMutation = useRegisterMutation();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [consent, setConsent] = useState(false);
	const [blocked, setBlocked] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (!consent) {
			setBlocked(true);
			return;
		}
		setBlocked(false);
		await registerMutation.mutateAsync({ email, password, consent_152fz: true });
		router.navigate('/dashboard', { replace: true });
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-email'>Email</Label>
				<Input
					id='register-email'
					type='email'
					value={email}
					onChange={event => setEmail(event.target.value)}
					required
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-password'>Пароль</Label>
				<Input
					id='register-password'
					type='password'
					value={password}
					onChange={event => setPassword(event.target.value)}
					minLength={8}
					required
				/>
			</div>
			<label className='flex items-start gap-2 text-sm'>
				<input
					className='mt-1'
					type='checkbox'
					checked={consent}
					onChange={event => setConsent(event.target.checked)}
				/>
				<span>Я согласен на обработку персональных данных по 152-ФЗ.</span>
			</label>
			{blocked ? <p className='text-sm text-destructive'>Согласие обязательно для создания аккаунта.</p> : null}
			{registerMutation.isError ? (
				<p className='text-sm text-destructive'>Не удалось создать аккаунт.</p>
			) : null}
			<Button type='submit' disabled={registerMutation.isPending}>
				{registerMutation.isPending ? 'Создание...' : 'Создать аккаунт'}
			</Button>
			<Button asChild type='button' variant='outline'>
				<AppLink to='/topics'>Продолжить как гость</AppLink>
			</Button>
		</form>
	);
}
