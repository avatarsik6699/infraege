export const authQueryKeys = {
	token: ['auth', 'token'] as const,
	me: ['auth', 'me'] as const,
};

export const progressQueryKeys = {
	summary: ['progress', 'summary'] as const,
};

export const taskQueryKeys = {
	all: ['tasks'] as const,
	publicCatalog: (filters?: { search?: string; difficulty?: string }) =>
		['tasks', 'public', 'catalog', filters ?? {}] as const,
	publicDetail: (slug: string) => ['tasks', 'public', 'detail', slug] as const,
};
