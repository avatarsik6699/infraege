import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

export default function HomePage() {
	return (
		<main className='page-shell'>
			<header className='home-hero'>
				<p className='kicker'>ЕГЭ по информатике</p>
				<h1 className='serif hero-title'>infraege</h1>
				<p className='lede'>Подготовка к ЕГЭ по информатике: теория, практика и прогресс в одном месте.</p>
				<div className='flex flex-wrap gap-3'>
					<Button asChild size='lg'>
						<AppLink to='/topics'>К темам</AppLink>
					</Button>
					<Button asChild variant='outline' size='lg'>
						<AppLink to='/practice/demo'>Продолжить как гость</AppLink>
					</Button>
				</div>
			</header>
		</main>
	);
}
