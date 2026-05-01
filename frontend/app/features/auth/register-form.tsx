import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useRegisterMutation } from '@shared/api/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
	const { t } = useTranslation('common');
	const { t: tErrors } = useTranslation('errors');
	const navigate = useNavigate();
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
		navigate('/dashboard', { replace: true });
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-email'>{t('email')}</Label>
				<Input id='register-email' type='email' value={email} onChange={event => setEmail(event.target.value)} required />
			</div>
			<div className='grid gap-1.5'>
				<Label htmlFor='register-password'>{t('password')}</Label>
				<Input id='register-password' type='password' value={password} onChange={event => setPassword(event.target.value)} minLength={8} required />
			</div>
			<label className='flex items-start gap-2 text-sm'>
				<input className='mt-1' type='checkbox' checked={consent} onChange={event => setConsent(event.target.checked)} />
				<span>{t('register.consent')}</span>
			</label>
			{blocked ? <p className='text-sm text-destructive'>{t('register.consentRequired')}</p> : null}
			{registerMutation.isError ? <p className='text-sm text-destructive'>{tErrors('unableRegister')}</p> : null}
			<Button type='submit' disabled={registerMutation.isPending}>
				{registerMutation.isPending ? t('register.creating') : t('register.submit')}
			</Button>
		</form>
	);
}
