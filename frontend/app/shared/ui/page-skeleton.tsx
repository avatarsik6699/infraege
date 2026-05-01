export function PageSkeleton() {
	return (
		<main className='shell' aria-busy='true' aria-live='polite'>
			<section className='card space-y-4'>
				<div className='h-8 w-48 animate-pulse rounded-md bg-muted' />
				<div className='h-4 w-full animate-pulse rounded-md bg-muted' />
				<div className='h-4 w-3/4 animate-pulse rounded-md bg-muted' />
			</section>
		</main>
	);
}
