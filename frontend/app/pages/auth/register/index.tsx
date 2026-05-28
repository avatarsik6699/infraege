import { RegisterForm } from '@features/auth/register-form';

export default function RegisterPage() {
	return (
		<main className='shell shell-narrow'>
			<section className='card space-y-4' aria-labelledby='register-title'>
				<h1 id='register-title' className='text-2xl font-semibold tracking-tight'>
					Создать аккаунт
				</h1>
				<p className='text-sm text-muted-foreground'>
					Создай аккаунт, чтобы позже синхронизировать прогресс, или продолжай как гость.
				</p>
				<RegisterForm />
			</section>
		</main>
	);
}
