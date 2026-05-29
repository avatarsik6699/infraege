import type { FormEvent } from 'react';
import { useState } from 'react';

import { useProgressSync } from '@features/progress-sync/use-progress-sync';
import { useLoginMutation } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { AppLink } from '@shared/ui/app-link';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { PasswordInput } from '@shared/ui/password-input';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
	const router = useRouter();
	const loginMutation = useLoginMutation();
	const { triggerSync } = useProgressSync();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		await loginMutation.mutateAsync({ email, password });
		await triggerSync();
		if (onSuccess) {
			onSuccess();
		} else {
			router.navigate('/profile', { replace: true });
		}
	};

	return (
		<form className='grid gap-4' onSubmit={onSubmit}>
			<div className='grid gap-1.5'>
				<Label htmlFor='login-email'>Email</Label>
				<Input
					id='login-email'
					name='email'
					type='email'
					autoComplete='email'
					value={email}
					onChange={event => setEmail(event.target.value)}
					required
				/>
			</div>
			<div className='grid gap-1.5'>
				<div className='flex items-center justify-between'>
					<Label htmlFor='login-password'>Пароль</Label>
					<span className='text-xs text-muted-foreground'>Забыл пароль? (скоро)</span>
				</div>
				<PasswordInput
					id='login-password'
					name='password'
					autoComplete='current-password'
					value={password}
					onChange={event => setPassword(event.target.value)}
					required
				/>
			</div>
			<label className='flex items-center gap-2 text-sm select-none cursor-pointer'>
				<input
					type='checkbox'
					checked={rememberMe}
					onChange={event => setRememberMe(event.target.checked)}
					className='rounded'
				/>
				<span className='text-muted-foreground'>Запомнить меня</span>
			</label>
			{loginMutation.isError ? (
				<p className='text-sm text-destructive'>Не удалось войти. Проверь email и пароль.</p>
			) : null}
			<Button type='submit' disabled={loginMutation.isPending} className='w-full'>
				{loginMutation.isPending ? 'Вход...' : 'Войти'}
			</Button>
			<Button asChild type='button' variant='outline' className='w-full'>
				<AppLink to='/topics'>Решать как гость</AppLink>
			</Button>
			<p className='text-center text-sm text-muted-foreground'>
				Нет аккаунта?{' '}
				<AppLink to='/register' className='font-medium text-foreground hover:underline'>
					Создать
				</AppLink>
			</p>
			{import.meta.env.DEV ? (
				<div className='border border-dashed border-muted rounded p-3 grid gap-2'>
					<p className='text-xs text-muted-foreground font-medium'>Dev: быстрый вход</p>
					<div className='flex gap-2'>
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='flex-1 text-xs'
							onClick={() => {
								setEmail('admin@example.com');
								setPassword('Admin1234!');
							}}
						>
							Администратор
						</Button>
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='flex-1 text-xs'
							onClick={() => {
								setEmail('user@example.com');
								setPassword('User1234!');
							}}
						>
							Студент
						</Button>
					</div>
				</div>
			) : null}
		</form>
	);
}
