import { LoginForm } from '@features/auth/login-form';

export default function LoginPage() {
	return (
		<main className='shell shell-narrow'>
			<section className='card space-y-4' aria-labelledby='login-title'>
				<h1 id='login-title' className='text-2xl font-semibold tracking-tight'>
					Вход
				</h1>
				<p className='text-sm text-muted-foreground'>Войди в аккаунт или продолжай готовиться как гость.</p>
				<LoginForm />
			</section>
		</main>
	);
}
