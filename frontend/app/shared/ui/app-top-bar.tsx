import { User } from 'lucide-react';
import { useLocation } from 'react-router';

import { useSessionSummary } from '@shared/api/auth';

import { AppLink } from './app-link';

const HIDDEN_ROUTES = new Set(['/login', '/register']);

function Logo() {
	return (
		<AppLink
			to='/'
			aria-label='infraege — на главную'
			style={{
				fontFamily: 'var(--serif)',
				fontStyle: 'italic',
				fontWeight: 500,
				fontSize: 20,
				letterSpacing: '-0.025em',
				color: 'var(--ink)',
				textDecoration: 'none',
				lineHeight: 1,
			}}
		>
			learn<span style={{ color: 'var(--coral)' }}>info</span>ege
		</AppLink>
	);
}

const NAV_LINKS = [{ to: '/topics', label: 'Темы', matchPrefixes: ['/topics', '/tasks', '/practice'] }];

export function AppTopBar() {
	const location = useLocation();
	const { isAuthenticated, isAuthReady, meQuery } = useSessionSummary();
	const isAdmin = meQuery.data?.role === 'admin';

	if (HIDDEN_ROUTES.has(location.pathname)) return null;

	const visibleNavLinks = [
		...NAV_LINKS,
		...(isAdmin ? [{ to: '/admin/feedback', label: 'Админ', matchPrefixes: ['/admin'] }] : []),
	];

	return (
		<header
			className='px-3 py-2 md:px-4 md:py-3'
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				borderBottom: '1px solid var(--line)',
				background: 'var(--paper)',
				position: 'sticky',
				top: 0,
				zIndex: 5,
			}}
		>
			<Logo />

			<nav className='flex items-center gap-4 md:gap-6' aria-label='Основная навигация'>
				{visibleNavLinks.map(({ to, label, matchPrefixes }) => {
					const isActive = matchPrefixes.some(p => location.pathname.startsWith(p));
					return (
						<AppLink
							key={to}
							to={to}
							style={{
								fontFamily: 'var(--sans)',
								fontSize: '13.5px',
								fontWeight: 500,
								color: isActive ? 'var(--ink)' : 'var(--ink-3)',
								textDecoration: 'none',
								transition: 'color 0.12s',
							}}
						>
							{label}
						</AppLink>
					);
				})}
			</nav>

			{!isAuthReady ? (
				<div aria-hidden='true' className='h-10 w-10' />
			) : isAuthenticated ? (
				<AppLink
					to='/profile'
					aria-label='Профиль'
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 40,
						height: 40,
						borderRadius: 12,
						background: 'transparent',
						color: 'var(--ink)',
					}}
				>
					<User size={20} strokeWidth={1.8} />
				</AppLink>
			) : (
				<AppLink
					to='/login'
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						height: 36,
						padding: '0 14px',
						borderRadius: 999,
						border: '1px solid var(--line-strong)',
						background: 'transparent',
						fontFamily: 'var(--sans)',
						fontSize: 13,
						fontWeight: 600,
						color: 'var(--ink)',
						textDecoration: 'none',
						letterSpacing: '-0.005em',
						whiteSpace: 'nowrap',
					}}
				>
					Войти
				</AppLink>
			)}
		</header>
	);
}
