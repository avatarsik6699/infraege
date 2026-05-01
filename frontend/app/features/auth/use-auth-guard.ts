import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useAuthToken } from '@shared/api/auth';

export function shouldRedirectToLogin(accessToken?: string): boolean {
	return !accessToken;
}

export function useAuthGuard() {
	const navigate = useNavigate();
	const location = useLocation();
	const { data: token } = useAuthToken();

	useEffect(() => {
		if (shouldRedirectToLogin(token?.access_token)) {
			navigate('/login', {
				replace: true,
				state: { from: location.pathname },
			});
		}
	}, [location.pathname, navigate, token?.access_token]);

	return {
		isAuthenticated: Boolean(token?.access_token),
	};
}
