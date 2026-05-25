import { useEffect } from 'react';

import { useAuthToken } from '@shared/api/auth';
import { useRouter } from '@shared/hooks/use-router';
import { isNonEmptyString } from '@shared/lib/type-guards';

export function shouldRedirectToLogin(accessToken?: string): boolean {
	return !isNonEmptyString(accessToken);
}

export function useAuthGuard() {
	const router = useRouter();
	const tokenQuery = useAuthToken();

	useEffect(
		function redirectToLoginFx() {
			if (shouldRedirectToLogin(tokenQuery.data?.access_token)) {
				router.navigate('/login', {
					replace: true,
					state: { from: router.location.pathname },
				});
			}
		},
		[router, tokenQuery.data?.access_token]
	);

	return {
		isAuthenticated: Boolean(tokenQuery.data?.access_token),
	};
}
