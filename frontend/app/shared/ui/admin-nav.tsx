import { BarChart3, MessageSquareText, Server } from 'lucide-react';
import { useLocation } from 'react-router';

import { AppLink } from './app-link';

const ADMIN_LINKS = [
	{ to: '/admin/feedback', label: 'Обратная связь', icon: MessageSquareText },
	{ to: '/admin/status', label: 'Статус', icon: Server },
	{ to: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
];

export function AdminNav() {
	const location = useLocation();

	return (
		<nav className='mb-6 flex flex-wrap gap-2' aria-label='Администрирование'>
			{ADMIN_LINKS.map(({ to, label, icon: Icon }) => {
				const isActive = location.pathname === to;
				return (
					<AppLink
						key={to}
						to={to}
						aria-current={isActive ? 'page' : undefined}
						className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium no-underline transition-colors ${
							isActive
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
						}`}
					>
						<Icon size={16} strokeWidth={1.8} aria-hidden='true' />
						{label}
					</AppLink>
				);
			})}
		</nav>
	);
}
