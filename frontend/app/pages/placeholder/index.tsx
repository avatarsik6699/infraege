import { isNonEmptyString } from '@shared/lib/type-guards';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

type PlaceholderPageProps = {
	kicker: string;
	title: string;
	description: string;
	ctaHref?: string;
	ctaLabel?: string;
};

export function PlaceholderPage({ kicker, title, description, ctaHref, ctaLabel }: PlaceholderPageProps) {
	return (
		<main className='page-shell'>
			<section className='placeholder-panel'>
				<p className='kicker'>{kicker}</p>
				<h1 className='serif page-title'>{title}</h1>
				<p className='lede'>{description}</p>
				{isNonEmptyString(ctaHref) && isNonEmptyString(ctaLabel) ? (
					<div>
						<Button asChild size='lg'>
							<AppLink to={ctaHref}>{ctaLabel}</AppLink>
						</Button>
					</div>
				) : null}
			</section>
		</main>
	);
}
