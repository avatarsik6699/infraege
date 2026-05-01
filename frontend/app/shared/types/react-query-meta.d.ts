import '@tanstack/react-query';

type AppQueryMeta = Record<string, unknown> & {
	disableGlobalErrorHandler?: boolean;
};

declare module '@tanstack/react-query' {
	interface Register {
		queryMeta: AppQueryMeta;
		mutationMeta: AppQueryMeta;
	}
}
