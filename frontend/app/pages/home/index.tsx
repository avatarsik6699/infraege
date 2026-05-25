import { useTranslation } from 'react-i18next';

import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

export default function HomePage() {
	const { t } = useTranslation('common');

	return (
		<main className='shell grid gap-6'>
			<header className='grid gap-2'>
				<h1 className='text-4xl font-semibold'>{t('homeTitle')}</h1>
				<p className='text-muted-foreground'>{t('homeDescription')}</p>
			</header>
			<div className='flex flex-wrap gap-3'>
				<Button asChild>
					<AppLink to='/login'>{t('auth.cta.signIn')}</AppLink>
				</Button>
				<Button asChild variant='outline'>
					<AppLink to='/register'>{t('auth.cta.register')}</AppLink>
				</Button>
			</div>
		</main>
	);
}
