import { useTranslation } from 'react-i18next';

import { LoginForm } from '@features/auth/login-form';

export default function LoginPage() {
	const { t: tCommon } = useTranslation('common');
	const { t: tErrors } = useTranslation('errors');

	return (
		<main className='shell shell-narrow'>
			<section className='card space-y-4' aria-labelledby='login-title'>
				<h1 id='login-title' className='text-2xl font-semibold tracking-tight'>
					{tErrors('signIn')}
				</h1>
				<p className='text-sm text-muted-foreground'>{tCommon('loginHint')}</p>
				<LoginForm />
			</section>
		</main>
	);
}
