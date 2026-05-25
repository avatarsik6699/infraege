import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { useLogoutMutation, useSessionSummary } from '@shared/api/auth';
import { Button } from '@shared/ui/button';
import { LanguageSwitcher } from '@shared/ui/language-switcher';
import { ThemeToggle } from '@shared/ui/theme-toggle';

function maskToken(value: string): string {
	if (value.length <= 12) return '••••••';
	return `${value.slice(0, 8)}••••••${value.slice(-4)}`;
}

export function AppTopBar() {
	const { pathname } = useLocation();
	const { t } = useTranslation('common');
	const { accessToken, isAuthenticated, meQuery } = useSessionSummary();
	const logoutMutation = useLogoutMutation();
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

	const isCompact = pathname.startsWith('/login');
	const tokenValue = accessToken ? `Bearer ${accessToken}` : '';
	const tokenPreview = useMemo(() => {
		if (!accessToken) return '';
		return isTokenVisible ? tokenValue : maskToken(tokenValue);
	}, [accessToken, isTokenVisible, tokenValue]);

	const onCopyToken = async () => {
		if (!tokenValue) return;
		try {
			await navigator.clipboard.writeText(tokenValue);
			setCopyState('success');
		} catch {
			setCopyState('error');
		}
	};

	return (
		<header className='topbar border-b border-border/60 bg-background/95 backdrop-blur'>
			<div className='topbar-inner'>
				<div className='flex items-center gap-3'>
					<Link to='/' className='text-sm font-semibold tracking-tight'>
						{t('brand')}
					</Link>
					<LanguageSwitcher />
					<ThemeToggle />
				</div>
				{isCompact ? null : (
					<div className='flex flex-wrap items-center justify-end gap-2'>
						{!isAuthenticated ? (
							<>
								<span className='text-xs text-muted-foreground'>{t('auth.status.guest')}</span>
								<Button asChild size='sm' variant='outline'>
									<Link to='/login'>{t('auth.cta.signIn')}</Link>
								</Button>
								<Button asChild size='sm' variant='ghost'>
									<Link to='/register'>{t('auth.cta.register')}</Link>
								</Button>
							</>
						) : (
							<>
								{meQuery.isLoading ? (
									<span className='text-xs text-muted-foreground'>{t('auth.status.loading')}</span>
								) : meQuery.isError ? (
									<>
										<span className='text-xs text-destructive'>{t('auth.status.error')}</span>
										<Button type='button' size='sm' variant='ghost' onClick={() => void meQuery.refetch()}>
											{t('auth.cta.retry')}
										</Button>
									</>
								) : (
									<span className='text-xs text-muted-foreground'>
										{t('auth.signedInAs', {
											email: meQuery.data?.email ?? t('auth.unknown'),
											role: t(`auth.roles.${meQuery.data?.role ?? 'user'}`),
											status: meQuery.data?.is_active ? t('auth.active') : t('auth.inactive'),
										})}
									</span>
								)}
								<Button asChild size='sm' variant='outline'>
									<Link to='/dashboard'>{t('auth.cta.dashboard')}</Link>
								</Button>
								<div className='flex items-center gap-2 rounded-md border border-border px-2 py-1'>
									<span className='text-xs text-muted-foreground'>{t('auth.apiToken')}</span>
									<code className='max-w-[220px] truncate text-xs'>{tokenPreview}</code>
									<Button
										type='button'
										size='sm'
										variant='ghost'
										onClick={() => setIsTokenVisible(current => !current)}
									>
										{isTokenVisible ? t('auth.cta.hide') : t('auth.cta.show')}
									</Button>
									<Button type='button' size='sm' variant='ghost' onClick={() => void onCopyToken()}>
										{t('auth.cta.copy')}
									</Button>
								</div>
								<span className='text-xs text-muted-foreground'>{t('auth.swaggerHint')}</span>
								{copyState === 'success' ? (
									<span className='text-xs text-emerald-600'>{t('auth.copySuccess')}</span>
								) : null}
								{copyState === 'error' ? <span className='text-xs text-destructive'>{t('auth.copyError')}</span> : null}
								<Button
									type='button'
									size='sm'
									variant='ghost'
									disabled={logoutMutation.isPending}
									onClick={() => logoutMutation.mutate()}
								>
									{t('auth.cta.signOut')}
								</Button>
							</>
						)}
					</div>
				)}
			</div>
		</header>
	);
}
