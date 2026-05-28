import type { FormEvent } from 'react';
import { useState } from 'react';

import { useLoginMutation } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';

export const DEFAULT_LOGIN_EMAIL = 'admin@example.com';
export const DEFAULT_LOGIN_PASSWORD = 'changeme123';

export function LoginForm() {
	const router = useRouter();
	const loginMutation = useLoginMutation();
	const [email, setEmail] = useState(DEFAULT_LOGIN_EMAIL);
	const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD);

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		await loginMutation.mutateAsync({ email, password });
		router.navigate('/dashboard', { replace: true });
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='email'>Email</Label>
				<Input
					id='email'
					name='email'
					type='email'
					value={email}
					onChange={event => setEmail(event.target.value)}
					required
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='password'>Пароль</Label>
				<Input
					id='password'
					name='password'
					type='password'
					value={password}
					onChange={event => setPassword(event.target.value)}
					required
				/>
			</div>
			{loginMutation.isError ? (
				<p className='text-sm text-destructive'>Не удалось войти с этими данными.</p>
			) : null}
			<Button type='submit' disabled={loginMutation.isPending}>
				{loginMutation.isPending ? 'Вход...' : 'Войти'}
			</Button>
			<Button asChild type='button' variant='outline'>
				<AppLink to='/topics'>Продолжить как гость</AppLink>
			</Button>
		</form>
	);
}
