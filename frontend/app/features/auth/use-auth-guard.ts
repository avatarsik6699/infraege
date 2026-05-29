import { useEffect } from 'react';

import { useSessionSummary } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { isNonEmptyString } from '@shared/lib/type-guards';

export function shouldRedirectToLogin(accessToken?: string): boolean {
	return !isNonEmptyString(accessToken);
}

export function useAuthGuard() {
	const router = useRouter();
	const { isAuthenticated, isAuthReady, accessToken } = useSessionSummary();

	useEffect(
		function redirectToLoginFx() {
			if (isAuthReady && shouldRedirectToLogin(accessToken ?? undefined)) {
				router.navigate('/login', {
					replace: true,
					state: { from: router.location.pathname },
				});
			}
		},
		[accessToken, isAuthReady, router]
	);

	return {
		isAuthenticated,
		isAuthReady,
	};
}
