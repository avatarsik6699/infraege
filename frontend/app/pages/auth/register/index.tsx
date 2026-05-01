import { useTranslation } from 'react-i18next';

import { RegisterForm } from '@features/auth/register-form';

export default function RegisterPage() {
	const { t } = useTranslation('common');

	return (
		<main className='shell shell-narrow'>
			<section className='card space-y-4' aria-labelledby='register-title'>
				<h1 id='register-title' className='text-2xl font-semibold tracking-tight'>
					{t('register.title')}
				</h1>
				<p className='text-sm text-muted-foreground'>{t('register.hint')}</p>
				<RegisterForm />
			</section>
		</main>
	);
}
