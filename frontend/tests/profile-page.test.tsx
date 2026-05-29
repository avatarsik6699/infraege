import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { progressQueryKeys } from '@shared/api/keys';
import type { ProfileMe } from '@entities/user/model/user.types';

const emptyProfile: ProfileMe = {
	stats: {
		totalTasks: 0,
		solvedTasks: 0,
		correctAttempts: 0,
		totalAttempts: 0,
		streak: 0,
		lastActivityAt: null,
	},
	weakTasks: [],
	recentActivity: [],
};

const filledProfile: ProfileMe = {
	stats: {
		totalTasks: 5,
		solvedTasks: 3,
		correctAttempts: 12,
		totalAttempts: 18,
		streak: 2,
		lastActivityAt: '2026-05-29T10:00:00Z',
	},
	weakTasks: [
		{
			taskId: '11111111-0000-0000-0000-000000000001',
			taskSlug: 'ege-01',
			taskTitle: 'Информационные модели',
			egeNumber: 1,
			solvedCount: 1,
			totalCount: 5,
			accuracy: 0.2,
		},
	],
	recentActivity: [{ date: '2026-05-29', count: 5 }],
};

class MemoryStorage implements Storage {
	private values = new Map<string, string>();
	get length() { return this.values.size; }
	clear() { this.values.clear(); }
	getItem(key: string) { return this.values.get(key) ?? null; }
	key(index: number) { return [...this.values.keys()][index] ?? null; }
	removeItem(key: string) { this.values.delete(key); }
	setItem(key: string, value: string) { this.values.set(key, value); }
}

async function renderProfile(profileData?: ProfileMe): Promise<string> {
	const { default: ProfilePage } = await import('@pages/profile');
	const queryClient = new QueryClient();
	if (profileData) {
		queryClient.setQueryData(progressQueryKeys.me, profileData);
	}
	const router = createMemoryRouter([
		{
			path: '/',
			element: (
				<QueryClientProvider client={queryClient}>
					<ProfilePage />
				</QueryClientProvider>
			),
		},
		{ path: '/login', element: null },
	]);

	return renderToStaticMarkup(<RouterProvider router={router} />);
}

describe('ProfilePage', () => {
	beforeEach(() => {
		vi.stubGlobal('window', { localStorage: new MemoryStorage() });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows login CTA when unauthenticated (no token in store)', async () => {
		const html = await renderProfile();
		// Without a token, profile shows the login prompt
		expect(html).toContain('Профиль');
		expect(html).toContain('/login');
	});

	it('renders empty profile message for zero stats', async () => {
		const html = await renderProfile(emptyProfile);
		expect(html).toContain('Профиль');
	});
});

describe('ProfileMe type shape', () => {
	it('has the expected structure', () => {
		const profile: ProfileMe = emptyProfile;
		expect(typeof profile.stats.totalTasks).toBe('number');
		expect(typeof profile.stats.streak).toBe('number');
		expect(Array.isArray(profile.weakTasks)).toBe(true);
		expect(Array.isArray(profile.recentActivity)).toBe(true);
	});

	it('weak task has accuracy field', () => {
		const task = filledProfile.weakTasks[0];
		expect(typeof task?.accuracy).toBe('number');
		expect(task?.accuracy).toBe(0.2);
	});
});
