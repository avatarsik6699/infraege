import { ArrowRight, BookOpen, ListFilter, Play } from 'lucide-react';

import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';

export default function HomePage() {
	return (
		<main className='page-shell home-page'>
			<header className='home-hero'>
				<div className='home-hero-copy'>
					<p className='kicker'>ЕГЭ по информатике</p>
					<h1 className='serif hero-title'>infraege</h1>
					<p className='lede'>
						Публичный каталог заданий, короткая теория и быстрый переход к тренировке без лишнего шума.
					</p>
				</div>
				<div className='home-actions'>
					<Button asChild size='lg'>
						<AppLink to='/topics'>
							<ListFilter aria-hidden='true' className='size-4' />
							Каталог заданий
						</AppLink>
					</Button>
					<Button asChild variant='outline' size='lg'>
						<AppLink to='/practice/demo'>
							<Play aria-hidden='true' className='size-4' />
							Тренажер
						</AppLink>
					</Button>
				</div>
				<section className='home-quick-grid' aria-label='Быстрые разделы'>
					<AppLink to='/topics' className='home-quick-link'>
						<BookOpen aria-hidden='true' className='size-5' />
						<span>
							<strong>Теория по номерам</strong>
							<small>Все опубликованные задания в одном списке</small>
						</span>
						<ArrowRight aria-hidden='true' className='size-4' />
					</AppLink>
					<AppLink to='/practice/demo' className='home-quick-link'>
						<Play aria-hidden='true' className='size-5' />
						<span>
							<strong>Практика</strong>
							<small>Вход в тренировочный сценарий без реализации новой логики</small>
						</span>
						<ArrowRight aria-hidden='true' className='size-4' />
					</AppLink>
				</section>
			</header>
		</main>
	);
}
