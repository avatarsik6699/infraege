import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { useLogoutMutation, useSessionSummary } from '@shared/api/auth';
import { clipboard } from '@shared/lib/clipboard';
import { isNonEmptyString } from '@shared/lib/type-guards';
import { Button } from '@shared/ui/button';
import { ThemeToggle } from '@shared/ui/theme-toggle';

function maskToken(value: string): string {
	if (value.length <= 12) return '••••••';
	return `${value.slice(0, 8)}••••••${value.slice(-4)}`;
}

export function AppTopBar() {
	const { pathname } = useLocation();
	const { accessToken, isAuthenticated, meQuery } = useSessionSummary();
	const logoutMutation = useLogoutMutation();
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

	const isCompact = pathname.startsWith('/login');
	const tokenValue = isNonEmptyString(accessToken) ? `Bearer ${accessToken}` : '';
	const tokenPreview = useMemo(() => {
		if (!isNonEmptyString(accessToken)) return '';
		return isTokenVisible ? tokenValue : maskToken(tokenValue);
	}, [accessToken, isTokenVisible, tokenValue]);

	const onCopyToken = async () => {
		if (!isNonEmptyString(tokenValue)) return;
		const didCopy = await clipboard.writeText(tokenValue);
		if (didCopy) {
			setCopyState('success');
			return;
		}

		setCopyState('error');
	};

	return (
		<header className='topbar border-b border-border/60 bg-background/95 backdrop-blur'>
			<div className='topbar-inner'>
				<div className='flex items-center gap-3'>
					<Link to='/' className='text-sm font-semibold tracking-tight'>
						infraege
					</Link>
					<ThemeToggle />
				</div>
				{isCompact ? null : (
					<div className='flex flex-wrap items-center justify-end gap-2'>
						{!isAuthenticated ? (
							<>
								<span className='text-xs text-muted-foreground'>Не авторизован</span>
								<Button asChild size='sm' variant='outline'>
									<Link to='/login'>Войти</Link>
								</Button>
								<Button asChild size='sm' variant='ghost'>
									<Link to='/register'>Регистрация</Link>
								</Button>
							</>
						) : (
							<>
								{meQuery.isLoading ? (
									<span className='text-xs text-muted-foreground'>Загрузка профиля...</span>
								) : meQuery.isError ? (
									<>
										<span className='text-xs text-destructive'>Не удалось загрузить профиль</span>
										<Button type='button' size='sm' variant='ghost' onClick={() => void meQuery.refetch()}>
											Повторить
										</Button>
									</>
								) : (
									<span className='text-xs text-muted-foreground'>
										{meQuery.data?.email ?? 'неизвестно'} ·{' '}
										{meQuery.data?.role === 'admin' ? 'админ' : 'пользователь'} ·{' '}
										{meQuery.data?.is_active === true ? 'активен' : 'неактивен'}
									</span>
								)}
								<Button asChild size='sm' variant='outline'>
									<Link to='/dashboard'>Кабинет</Link>
								</Button>
								<div className='flex items-center gap-2 rounded-md border border-border px-2 py-1'>
									<span className='text-xs text-muted-foreground'>API токен</span>
									<code className='max-w-[220px] truncate text-xs'>{tokenPreview}</code>
									<Button
										type='button'
										size='sm'
										variant='ghost'
										onClick={() => setIsTokenVisible(current => !current)}
									>
										{isTokenVisible ? 'Скрыть' : 'Показать'}
									</Button>
									<Button type='button' size='sm' variant='ghost' onClick={() => void onCopyToken()}>
										Копировать
									</Button>
								</div>
								<span className='text-xs text-muted-foreground'>Для /docs: Bearer &lt;access_token&gt;</span>
								{copyState === 'success' ? (
									<span className='text-xs text-emerald-600'>Скопировано</span>
								) : null}
								{copyState === 'error' ? <span className='text-xs text-destructive'>Ошибка копирования</span> : null}
								<Button
									type='button'
									size='sm'
									variant='ghost'
									disabled={logoutMutation.isPending}
									onClick={() => logoutMutation.mutate()}
								>
									Выйти
								</Button>
							</>
						)}
					</div>
				)}
			</div>
		</header>
	);
}
