import LoginPage from '@pages/auth/login';

export function meta() {
	return [{ title: 'Login - Template App' }];
}

export default function LoginRoute() {
	return <LoginPage />;
}
