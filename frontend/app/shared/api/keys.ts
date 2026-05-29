export const authQueryKeys = {
	token: ['auth', 'token'] as const,
	me: ['auth', 'me'] as const,
};

export const progressQueryKeys = {
	summary: ['progress', 'summary'] as const,
	me: ['progress', 'me'] as const,
};

export const taskQueryKeys = {
	all: ['tasks'] as const,
	publicCatalog: (filters?: { search?: string; difficulty?: string }) =>
		['tasks', 'public', 'catalog', filters ?? {}] as const,
	publicDetail: (slug: string) => ['tasks', 'public', 'detail', slug] as const,
};

export const practiceQueryKeys = {
	all: ['practice'] as const,
	publicPractice: (taskId: string) => ['practice', 'public', taskId] as const,
	validate: ['practice', 'validate'] as const,
};

export const feedbackQueryKeys = {
	adminList: (filters?: { page?: number; perPage?: number; status?: string }) =>
		['feedback', 'admin', 'list', filters ?? {}] as const,
};
