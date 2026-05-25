import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

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
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},
	eslintPluginPrettierRecommended,
];
