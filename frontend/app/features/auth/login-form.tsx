import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useLoginMutation } from '@shared/api/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DEFAULT_LOGIN_EMAIL = 'admin@example.com';
export const DEFAULT_LOGIN_PASSWORD = 'changeme123';

export function LoginForm() {
	const { t: tCommon } = useTranslation('common');
	const { t: tErrors } = useTranslation('errors');
	const navigate = useNavigate();
	const loginMutation = useLoginMutation();
	const [email, setEmail] = useState(DEFAULT_LOGIN_EMAIL);
	const [password, setPassword] = useState(DEFAULT_LOGIN_PASSWORD);

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		await loginMutation.mutateAsync({ email, password });
		navigate('/dashboard', { replace: true });
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='email'>{tCommon('email')}</Label>
				<Input id='email' name='email' type='email' value={email} onChange={event => setEmail(event.target.value)} required />
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='password'>{tCommon('password')}</Label>
				<Input id='password' name='password' type='password' value={password} onChange={event => setPassword(event.target.value)} required />
			</div>
			{loginMutation.isError ? <p className='text-sm text-destructive'>{tErrors('unableSignIn')}</p> : null}
			<Button type='submit' disabled={loginMutation.isPending}>
				{loginMutation.isPending ? tErrors('signingIn') : tErrors('signIn')}
			</Button>
		</form>
	);
}
