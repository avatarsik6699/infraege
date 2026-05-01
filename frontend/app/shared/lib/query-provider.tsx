import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { PropsWithChildren } from 'react';

import { queryClient } from '@shared/api/query-client';
import { runtime } from '@shared/config/runtime';

export function QueryProvider({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{runtime.isDev ? <ReactQueryDevtools buttonPosition='bottom-left' initialIsOpen={false} /> : null}
		</QueryClientProvider>
	);
}
