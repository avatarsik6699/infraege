import { useMemo } from 'react';
import { useLocation, useMatches, useNavigate, useParams } from 'react-router';

export namespace RouterTypes {
	export type NavigateOptions = {
		replace?: boolean;
		state?: unknown;
	};

	export type Router = {
		params: Readonly<Record<string, string | undefined>>;
		location: ReturnType<typeof useLocation>;
		matches: ReturnType<typeof useMatches>;
		navigate: (to: string, options?: NavigateOptions) => void;
	};
}

export function useRouter(): RouterTypes.Router {
	const params = useParams();
	const location = useLocation();
	const matches = useMatches();
	const navigate = useNavigate();

	return useMemo(
		function routerValueFx() {
			return {
				params,
				location,
				matches,
				navigate,
			};
		},
		[location, matches, navigate, params]
	);
}
