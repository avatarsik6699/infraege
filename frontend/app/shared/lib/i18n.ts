import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
	en: {
		common: {
			brand: 'Template App',
			homeTitle: 'Template App',
			homeDescription: 'Reusable FastAPI + React Router SSR starter without domain business logic.',
			email: 'Email',
			password: 'Password',
			loginHint: 'Sign in with your account credentials.',
			register: {
				title: 'Create account',
				hint: 'Create an account to test auth flow in this starter.',
				submit: 'Create account',
				creating: 'Creating...',
				consent: 'I consent to personal data processing under 152-FZ.',
				consentRequired: 'Consent is required to create an account.',
			},
			auth: {
				status: {
					guest: 'Not signed in',
					loading: 'Loading profile...',
					error: 'Failed to load profile',
				},
				cta: {
					signIn: 'Sign in',
					register: 'Register',
					signOut: 'Sign out',
					retry: 'Retry',
					dashboard: 'Dashboard',
					show: 'Show',
					hide: 'Hide',
					copy: 'Copy',
				},
				roles: {
					user: 'user',
					admin: 'admin',
				},
				signedInAs: '{{email}} · {{role}} · {{status}}',
				active: 'active',
				inactive: 'inactive',
				unknown: 'unknown',
				apiToken: 'API token',
				swaggerHint: 'Use in /docs as: Bearer <access_token>',
				copySuccess: 'Copied',
				copyError: 'Copy failed',
			},
		},
		errors: {
			signIn: 'Sign in',
			signingIn: 'Signing in...',
			unableSignIn: 'Unable to sign in with provided credentials.',
			unableRegister: 'Unable to create account.',
			applicationError: 'Application error',
		},
	},
	ru: {
		common: {
			brand: 'Template App',
			homeTitle: 'Template App',
			homeDescription: 'Переиспользуемый стартовый FastAPI + React Router SSR без доменной бизнес-логики.',
			email: 'Email',
			password: 'Пароль',
			loginHint: 'Войдите с учетными данными аккаунта.',
			register: {
				title: 'Создать аккаунт',
				hint: 'Создайте аккаунт, чтобы проверить auth-flow в шаблоне.',
				submit: 'Создать аккаунт',
				creating: 'Создание...',
				consent: 'Я согласен на обработку персональных данных по 152-ФЗ.',
				consentRequired: 'Согласие обязательно для создания аккаунта.',
			},
			auth: {
				status: {
					guest: 'Не авторизован',
					loading: 'Загрузка профиля...',
					error: 'Не удалось загрузить профиль',
				},
				cta: {
					signIn: 'Войти',
					register: 'Регистрация',
					signOut: 'Выйти',
					retry: 'Повторить',
					dashboard: 'Кабинет',
					show: 'Показать',
					hide: 'Скрыть',
					copy: 'Копировать',
				},
				roles: {
					user: 'пользователь',
					admin: 'админ',
				},
				signedInAs: '{{email}} · {{role}} · {{status}}',
				active: 'активен',
				inactive: 'неактивен',
				unknown: 'неизвестно',
				apiToken: 'API токен',
				swaggerHint: 'Для /docs: Bearer <access_token>',
				copySuccess: 'Скопировано',
				copyError: 'Ошибка копирования',
			},
		},
		errors: {
			signIn: 'Вход',
			signingIn: 'Вход...',
			unableSignIn: 'Не удалось войти с этими данными.',
			unableRegister: 'Не удалось создать аккаунт.',
			applicationError: 'Ошибка приложения',
		},
	},
};

void i18n.use(LanguageDetector).use(initReactI18next).init({
	resources,
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: 'common',
	interpolation: { escapeValue: false },
});

export { i18n };
