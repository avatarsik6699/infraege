import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const appRawApiRestrictions = [
	{
		selector: "MemberExpression[object.name='JSON'][property.name=/^(parse|stringify)$/]",
		message: 'Use @shared/lib/safe-json instead of raw JSON.parse/stringify, except for explicit HTTP request bodies.',
	},
	{
		selector:
			"MemberExpression[object.type='MetaProperty'][object.meta.name='import'][object.property.name='meta'][property.name='env']",
		message: 'Read Vite env through @shared/config/env or @shared/config/runtime.',
	},
	{
		selector: 'MemberExpression[property.name=/^(localStorage|sessionStorage)$/]',
		message: 'Use @shared/lib/safe-ls instead of direct browser storage access.',
	},
	{
		selector: "CallExpression[callee.name='Date']",
		message: 'Use @shared/lib/date instead of raw Date calls in application code.',
	},
	{
		selector: "NewExpression[callee.name='Date']",
		message: 'Use @shared/lib/date instead of constructing Date directly in application code.',
	},
	{
		selector: "MemberExpression[object.name='Date']",
		message: 'Use @shared/lib/date instead of raw Date static APIs in application code.',
	},
];

const rawRuntimeGlobals = [
	{
		name: 'fetch',
		message: 'Use @shared/api/client instead of direct fetch in application code.',
	},
	{
		name: 'window',
		message: 'Use @shared/lib/browser instead of direct browser globals.',
	},
	{
		name: 'document',
		message: 'Use @shared/lib/browser instead of direct browser globals.',
	},
	{
		name: 'navigator',
		message: 'Use @shared/lib/browser or focused wrappers such as @shared/lib/clipboard.',
	},
	{
		name: 'location',
		message: 'Use React Router helpers instead of direct location access.',
	},
	{
		name: 'history',
		message: 'Use React Router helpers instead of direct history mutation.',
	},
	{
		name: 'setTimeout',
		message: 'Use @shared/lib/timers instead of raw timers.',
	},
	{
		name: 'clearTimeout',
		message: 'Use @shared/lib/timers instead of raw timers.',
	},
	{
		name: 'setInterval',
		message: 'Use @shared/lib/timers instead of raw timers.',
	},
	{
		name: 'clearInterval',
		message: 'Use @shared/lib/timers instead of raw timers.',
	},
	{
		name: 'requestAnimationFrame',
		message: 'Use @shared/lib/timers instead of raw animation frame APIs.',
	},
	{
		name: 'cancelAnimationFrame',
		message: 'Use @shared/lib/timers instead of raw animation frame APIs.',
	},
	{
		name: 'console',
		message: 'Use @shared/lib/logger instead of direct console calls.',
	},
	{
		name: 'URLSearchParams',
		message: 'Use @shared/hooks/use-typed-search-params instead of raw URLSearchParams.',
	},
];

const rawRuntimeGlobalsWithoutFetch = rawRuntimeGlobals.filter(restriction => restriction.name !== 'fetch');

const rawRuntimeSyntaxRestrictions = [
	{
		selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
		message: 'Use @shared/lib/random instead of Math.random.',
	},
	{
		selector: "CallExpression[callee.object.name='crypto'][callee.property.name='randomUUID']",
		message: 'Use @shared/lib/id instead of crypto.randomUUID.',
	},
	{
		selector:
			"CallExpression[callee.object.type='MemberExpression'][callee.object.object.name='globalThis'][callee.object.property.name='crypto'][callee.property.name='randomUUID']",
		message: 'Use @shared/lib/id instead of crypto.randomUUID.',
	},
	{
		selector:
			"MemberExpression[object.name='globalThis'][property.name=/^(window|document|navigator|location|history)$/]",
		message: 'Use @shared/lib/browser or routing helpers instead of direct globalThis browser APIs.',
	},
	{
		selector: "MemberExpression[object.name='location'][property.name='search']",
		message: 'Use @shared/hooks/use-typed-search-params instead of location.search.',
	},
	{
		selector:
			"CallExpression[callee.object.name='history'][callee.property.name=/^(pushState|replaceState|back|forward|go)$/]",
		message: 'Use React Router helpers instead of direct history mutation.',
	},
];

const rawRuntimeAllowedFiles = [
	'app/shared/config/env.ts',
	'app/shared/config/runtime.ts',
	'app/shared/lib/browser.ts',
	'app/shared/lib/clipboard.ts',
	'app/shared/lib/date.ts',
	'app/shared/lib/id.ts',
	'app/shared/lib/logger.ts',
	'app/shared/lib/random.ts',
	'app/shared/lib/safe-json.ts',
	'app/shared/lib/safe-ls.ts',
	'app/shared/lib/timers.ts',
	'app/shared/hooks/use-typed-search-params.ts',
];

export default [
	{
		ignores: [
			'build/**',
			'.react-router/**',
			'app/shared/types/schema.ts',
			'coverage/**',
			'node_modules/**',
			'playwright-report/**',
			'scripts/**',
			'test-results/**',
		],
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			boundaries,
			import: importPlugin,
			react,
			'react-hooks': reactHooks,
		},
		rules: {
			...react.configs.flat.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/ban-ts-comment': [
				'warn',
				{
					'ts-expect-error': 'allow-with-description',
					'ts-ignore': true,
					'ts-nocheck': true,
					minimumDescriptionLength: 10,
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					disallowTypeAnnotations: false,
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/strict-boolean-expressions': [
				'error',
				{
					allowAny: false,
					allowNullableBoolean: false,
					allowNullableEnum: false,
					allowNullableNumber: false,
					allowNullableObject: false,
					allowNullableString: false,
					allowNumber: false,
					allowString: false,
				},
			],
			eqeqeq: 'error',
			'import/no-default-export': 'off',
			'import/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
					pathGroups: [
						{
							pattern: 'react',
							group: 'external',
							position: 'before',
						},
						{
							pattern: '@/**',
							group: 'internal',
							position: 'after',
						},
					],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
				},
			],
			'no-cond-assign': ['error', 'always'],
			'no-debugger': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'react/react-in-jsx-scope': 'off',
			'use-isnan': 'error',
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.json',
				},
			},
			react: {
				version: 'detect',
			},
			'boundaries/elements': [
				{ type: 'shared', pattern: 'app/shared/*', mode: 'folder', capture: ['segment'] },
				{ type: 'entity', pattern: 'app/entities/*', mode: 'folder', capture: ['entity'] },
				{ type: 'feature', pattern: 'app/features/*', mode: 'folder', capture: ['feature'] },
				{ type: 'page', pattern: 'app/pages/*', mode: 'folder', capture: ['page'] },
				{ type: 'widget', pattern: 'app/widgets/*', mode: 'folder', capture: ['widget'] },
				{ type: 'route', pattern: 'app/routes/*', mode: 'file', capture: ['route'] },
			],
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},
	{
		files: ['app/**/*.{ts,tsx}'],
		ignores: [
			'app/shared/api/client.ts',
			'app/shared/config/env.ts',
			'app/shared/config/runtime.ts',
			'app/shared/lib/date.ts',
			'app/shared/lib/safe-json.ts',
			'app/shared/lib/safe-ls.ts',
		],
		rules: {
			'no-restricted-globals': [
				'error',
				{
					name: 'localStorage',
					message: 'Use @shared/lib/safe-ls instead of direct browser storage access.',
				},
				{
					name: 'sessionStorage',
					message: 'Use @shared/lib/safe-ls instead of direct browser storage access.',
				},
			],
			'no-restricted-syntax': ['error', ...appRawApiRestrictions],
		},
	},
	{
		files: ['app/**/*.{ts,tsx}'],
		ignores: rawRuntimeAllowedFiles,
		rules: {
			'no-restricted-globals': ['error', ...rawRuntimeGlobals],
			'no-restricted-syntax': ['error', ...appRawApiRestrictions, ...rawRuntimeSyntaxRestrictions],
		},
	},
	{
		files: ['app/shared/api/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-globals': ['error', ...rawRuntimeGlobalsWithoutFetch],
		},
	},
	{
		files: ['app/**/*.{ts,tsx}'],
		ignores: ['app/shared/hooks/use-typed-search-params.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react-router',
							importNames: ['useSearchParams'],
							message: 'Use @shared/hooks/use-typed-search-params with a schema.',
						},
					],
				},
			],
		},
	},
	{
		files: ['app/features/**/*.{ts,tsx}', 'app/pages/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react-router',
							message: 'Use @shared/hooks/use-router or shared UI wrappers instead of React Router primitives.',
						},
					],
				},
			],
		},
	},
	{
		files: ['app/**/*.{ts,tsx}'],
		rules: {
			'boundaries/dependencies': [
				'error',
				{
					default: 'allow',
					rules: [
						{
							from: { type: 'shared' },
							disallow: { to: { type: ['entity', 'feature', 'page', 'widget', 'route'] } },
							message: 'Shared code must not import upper application layers.',
						},
						{
							from: { type: 'entity' },
							disallow: { to: { type: ['feature', 'page', 'widget', 'route'] } },
							message: 'Entities may import shared code and entity internals only.',
						},
						{
							from: { type: 'entity' },
							disallow: { to: { type: 'entity', captured: { entity: '!{{from.captured.entity}}' } } },
							message: 'Entities must not import other entity internals directly.',
						},
						{
							from: { type: 'feature' },
							disallow: { to: { type: ['page', 'widget', 'route'] } },
							message: 'Features may import shared/entities but not pages, widgets, or routes.',
						},
						{
							from: { type: 'page' },
							disallow: { to: { type: ['widget', 'route'] } },
							message: 'Pages may compose shared/entities/features but not widgets or routes.',
						},
						{
							from: { type: 'route' },
							disallow: { to: { type: ['entity', 'feature', 'widget', 'route'] } },
							message: 'Routes should compose pages and shared route metadata only.',
						},
					],
				},
			],
		},
	},
	{
		files: ['app/shared/api/client.ts'],
		rules: {
			'no-restricted-syntax': [
				'error',
				...appRawApiRestrictions.filter(
					restriction => !restriction.selector.startsWith("MemberExpression[object.name='JSON']")
				),
				...rawRuntimeSyntaxRestrictions,
			],
		},
	},
	eslintPluginPrettierRecommended,
];
