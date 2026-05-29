import { Skeleton } from '@shared/ui/skeleton';

export function PageSkeleton() {
	return (
		<main className='shell' aria-busy='true' aria-live='polite' aria-label='Загрузка страницы'>
			<section className='card space-y-4'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-4 w-full' />
				<Skeleton className='h-4 w-3/4' />
			</section>
		</main>
	);
}
