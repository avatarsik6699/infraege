import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';

export function DashboardPage() {
	return (
		<main className='shell'>
			<Card className='card'>
				<CardHeader>
					<CardTitle>infraege</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>
						Черновой кабинет. Статистика и синхронизация появятся в отдельной фазе.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
