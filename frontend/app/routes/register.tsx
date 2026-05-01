import RegisterPage from '@pages/auth/register';

export function meta() {
	return [{ title: 'Register - Template App' }];
}

export default function RegisterRoute() {
	return <RegisterPage />;
}
