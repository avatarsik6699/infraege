import { Link } from 'react-router';

import { LoginForm } from '@features/auth/login-form';
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
					<li>✓ Теория и практика по ЕГЭ Информатика</li>
					<li>✓ Прогресс синхронизируется между устройствами</li>
					<li>✓ Слабые темы выявляются автоматически</li>
				</ul>
			</div>
			<p className='text-xs text-background/40'>© 2026 infraege</p>
		</div>
	);
}

export default function LoginPage() {
	return (
		<div className='min-h-screen grid lg:grid-cols-2'>
			<BrandPanel />
			<main className='flex flex-col items-center justify-center px-6 py-12'>
				<div className='w-full max-w-sm space-y-6'>
					<div className='flex items-center justify-between lg:hidden'>
						<Link to='/' className='text-sm font-semibold'>
							infraege
						</Link>
						<AppLink to='/register' className='text-sm text-muted-foreground hover:text-foreground'>
							Нет аккаунта? Создать
						</AppLink>
					</div>
					<div className='hidden lg:flex justify-end'>
						<AppLink to='/register' className='text-sm text-muted-foreground hover:text-foreground'>
							Нет аккаунта? Создать
						</AppLink>
					</div>
					<div className='space-y-2'>
						<h1 className='text-2xl font-semibold tracking-tight'>С возвращением.</h1>
						<p className='text-sm text-muted-foreground'>Войди в аккаунт или продолжай как гость.</p>
					</div>
					<LoginForm />
				</div>
			</main>
		</div>
	);
}
