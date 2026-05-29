import { BookOpen, Home, Play, User } from 'lucide-react';
import type { ComponentType } from 'react';
import { useLocation } from 'react-router';

import { AppLink } from './app-link';

const HIDDEN_ROUTES = new Set(['/login', '/register']);

type TabItem = {
	to: string;
	label: string;
	Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
	isActive: (pathname: string) => boolean;
};

const TABS: TabItem[] = [
	{ to: '/', label: 'Главная', Icon: Home, isActive: p => p === '/' },
	{
		to: '/topics',
		label: 'Темы',
		Icon: BookOpen,
		isActive: p => p.startsWith('/topics') || p.startsWith('/tasks'),
	},
	{ to: '/practice/demo', label: 'Практика', Icon: Play, isActive: p => p.startsWith('/practice') },
	{ to: '/profile', label: 'Профиль', Icon: User, isActive: p => p === '/profile' },
];

export function TabBar() {
	const location = useLocation();

	if (HIDDEN_ROUTES.has(location.pathname)) return null;

	return (
		<nav
			aria-label='Навигация'
			className='md:hidden'
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(4, 1fr)',
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 5,
				borderTop: '1px solid var(--line)',
				background: 'rgba(251, 250, 247, 0.92)',
				backdropFilter: 'blur(12px)',
				padding: '8px 8px 12px',
			}}
		>
			{TABS.map(({ to, label, Icon, isActive }) => {
				const active = isActive(location.pathname);
				return (
					<AppLink
						key={to}
						to={to}
						aria-current={active ? 'page' : undefined}
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 2,
							padding: '4px 0',
							textDecoration: 'none',
							color: active ? 'var(--ink)' : 'var(--ink-4)',
							fontFamily: 'var(--sans)',
							fontSize: 11,
							fontWeight: 600,
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						<span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<Icon size={22} strokeWidth={active ? 2 : 1.8} />
							{active && (
								<span
									style={{
										position: 'absolute',
										bottom: -5,
										width: 4,
										height: 4,
										borderRadius: '50%',
										background: 'var(--coral)',
									}}
								/>
							)}
						</span>
						<span>{label}</span>
					</AppLink>
				);
			})}
		</nav>
	);
}
