import { ArrowRight, BookOpen, ListFilter, Play } from 'lucide-react';

import { FeedbackForm } from '@features/feedback/feedback-form';
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
						<AppLink to='/topics'>
							<Play aria-hidden='true' className='size-4' />
							Начать тренировку
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
					<AppLink to='/topics' className='home-quick-link'>
						<Play aria-hidden='true' className='size-5' />
						<span>
							<strong>Практика</strong>
							<small>Откройте задание и нажмите «К практике»</small>
						</span>
						<ArrowRight aria-hidden='true' className='size-4' />
					</AppLink>
				</section>
			</header>

		<section className='max-w-2xl border-t border-border pt-12 pb-16' aria-labelledby='feedback-heading'>
			<h2 id='feedback-heading' className='text-xl font-semibold mb-1'>Обратная связь</h2>
			<p className='text-sm text-muted-foreground mb-6'>Нашли ошибку или хотите что-то улучшить? Напишите нам.</p>
			<FeedbackForm />
		</section>
		</main>
	);
}
