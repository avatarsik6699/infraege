import { Skeleton } from '@shared/ui/skeleton';

export function SectionSkeleton() {
	return (
		<section className='space-y-3' aria-busy='true' aria-live='polite' aria-label='Загрузка секции'>
			<Skeleton className='h-5 w-32' />
			<Skeleton className='h-4 w-full' />
			<Skeleton className='h-4 w-2/3' />
		</section>
	);
}
