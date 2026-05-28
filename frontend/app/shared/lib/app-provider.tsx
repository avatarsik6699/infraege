import { ThemeProvider } from 'next-themes';
import type { PropsWithChildren } from 'react';

import { QueryProvider } from '@shared/lib/query-provider';

export function AppProvider({ children }: PropsWithChildren) {
	return (
		<ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
			<QueryProvider>{children}</QueryProvider>
		</ThemeProvider>
	);
}
