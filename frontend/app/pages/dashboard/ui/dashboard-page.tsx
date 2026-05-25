import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';

export function DashboardPage() {
	const { t } = useTranslation('common');

	return (
		<main className='shell'>
			<Card className='card'>
				<CardHeader>
					<CardTitle>{t('brand')}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>Starter authenticated area placeholder.</p>
				</CardContent>
			</Card>
		</main>
	);
}
