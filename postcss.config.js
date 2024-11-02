/** @type {import('tailwindcss').Config} */

module.exports = {
	plugins: {
		'postcss-import': {},
		'tailwindcss/nesting': 'postcss-nesting',
		tailwindcss: {},
		'postcss-preset-env': {
			stage: 2,
		},
		cssnano: process.env.NODE_ENV === 'production' ? {} : false,
	},
	rules: {
		'at-rule-no-unknown': [
			false,
			{ ignoreAtRules: ['extends', 'mixin', 'include', 'apply'] },
		],
	},
};
