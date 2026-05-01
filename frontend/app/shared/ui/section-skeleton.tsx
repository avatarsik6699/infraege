export function SectionSkeleton() {
	return (
		<section className='space-y-3' aria-busy='true' aria-live='polite'>
			<div className='h-5 w-32 animate-pulse rounded-md bg-muted' />
			<div className='h-4 w-full animate-pulse rounded-md bg-muted' />
			<div className='h-4 w-2/3 animate-pulse rounded-md bg-muted' />
		</section>
	);
}
