import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

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
					<Link to='/login'>{t('auth.cta.signIn')}</Link>
				</Button>
				<Button asChild variant='outline'>
					<Link to='/register'>{t('auth.cta.register')}</Link>
				</Button>
			</div>
		</main>
	);
}
