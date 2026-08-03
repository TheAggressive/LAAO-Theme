/**
 * ESLint flat configuration.
 *
 * Run directly rather than through `wp-scripts lint-js`: wp-scripts still pins
 * ESLint 8, which cannot read this format. Keeping the linter on its own
 * dependency lets it move to ESLint 9+ without waiting on a build-tool bump.
 *
 * Formatting rules are deliberately absent — Prettier owns formatting, and
 * eslint-config-prettier switches off anything that would conflict.
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import wpPlugin from '@wordpress/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** Globals the WordPress runtime provides to editor and front-end scripts. */
const wordpressGlobals = {
	wp: 'readonly',
	wpApiSettings: 'readonly',
};

export default [
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'vendor/**',
			'coverage/**',
			'*.config.js',
			'*.config.mjs',
			'*.config.cjs',
		],
	},

	js.configs.recommended,

	// Source: browser + WordPress globals, React/JSX rules, a11y rules.
	{
		files: ['src/**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
			globals: {
				...globals.browser,
				...wordpressGlobals,
			},
		},
		settings: {
			// Pinned rather than 'detect': React reaches this theme through
			// @wordpress/element, so it is not a direct dependency and detection
			// warns on every run. 18 is what WordPress 6.x bundles.
			react: { version: '18' },
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			'@wordpress': wpPlugin,
			react,
			'react-hooks': reactHooks,
			'jsx-a11y': jsxA11y,
		},
		rules: {
			...react.configs.flat.recommended.rules,
			...jsxA11y.flatConfigs.recommended.rules,

			// The automatic JSX runtime is in use; React need not be in scope.
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',

			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// Unused vars are an error, but an underscore prefix marks a binding
			// that exists only to satisfy a signature or destructuring position.
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],

			// console.error/warn are legitimate; bare console.log is debug residue.
			'no-console': ['error', { allow: ['warn', 'error'] }],

			eqeqeq: ['error', 'always', { null: 'ignore' }],
			'no-var': 'error',
			'prefer-const': 'error',
		},
	},

	// TypeScript-only rules. No .ts files exist yet; this makes the first one
	// land under the same gate as everything else.
	{
		files: ['src/**/*.{ts,tsx}'],
		rules: {
			...tsPlugin.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},

	// Jest specs: test globals are injected by the runner, and a spec may
	// legitimately log while diagnosing a failure.
	{
		files: [
			'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
			'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
		],
		languageOptions: {
			globals: {
				...globals.jest,
				...globals.node,
			},
		},
		rules: {
			'no-console': 'off',
		},
	},

	// Node scripts under bin/.
	{
		files: ['bin/**/*.{js,mjs}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: globals.node,
		},
		rules: {
			'no-console': 'off',
		},
	},

	prettierConfig,
];
