import { Link } from 'react-router';

import { RegisterForm } from '@features/auth/register-form';
import { AppLink } from '@shared/ui/app-link';

function BrandPanel() {
	return (
		<div className='hidden lg:flex flex-col justify-between bg-foreground text-background p-10 min-h-full'>
			<Link to='/' className='text-lg font-bold tracking-tight'>
				infraege
			</Link>
			<div className='space-y-6'>
				<p className='text-3xl font-semibold leading-tight'>
					27 задач.
					<br />
					Один экран.
					<br />
					Без лишнего.
				</p>
				<ul className='space-y-2 text-sm text-background/70'>
					<li>✓ Регистрация за минуту — бесплатно</li>
					<li>✓ Прогресс синхронизируется между устройствами</li>
					<li>✓ Слабые темы выявляются автоматически</li>
				</ul>
			</div>
			<p className='text-xs text-background/40'>© 2026 infraege</p>
		</div>
	);
}

export default function RegisterPage() {
	return (
		<div className='min-h-screen grid lg:grid-cols-2'>
			<BrandPanel />
			<main className='flex flex-col items-center justify-center px-6 py-12'>
				<div className='w-full max-w-sm space-y-6'>
					<div className='flex items-center justify-between lg:hidden'>
						<Link to='/' className='text-sm font-semibold'>
							infraege
						</Link>
						<AppLink to='/login' className='text-sm text-muted-foreground hover:text-foreground'>
							Уже есть аккаунт? Войти
						</AppLink>
					</div>
					<div className='hidden lg:flex justify-end'>
						<AppLink to='/login' className='text-sm text-muted-foreground hover:text-foreground'>
							Уже есть аккаунт? Войти
						</AppLink>
					</div>
					<div className='space-y-2'>
						<p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
							ШАГ 1 / 1 · БЕСПЛАТНО
						</p>
						<h1 className='text-2xl font-semibold tracking-tight'>Создай аккаунт за минуту.</h1>
					</div>
					<RegisterForm />
				</div>
			</main>
		</div>
	);
}
