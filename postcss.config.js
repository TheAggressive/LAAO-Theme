/** @type {import('tailwindcss').Config} */

module.exports = {
	plugins: {
		'postcss-import': {},
		'postcss-for': {},
		'tailwindcss/nesting': 'postcss-nesting',
		tailwindcss: {},
		'postcss-preset-env': {
			stage: 2,
		},
		cssnano: process.env.NODE_ENV === 'production' ? {} : false,
	},
	rules: {
		'at-rule-no-unknown': [
			true,
			{ ignoreAtRules: ['extends', 'mixin', 'include', 'apply', 'for'] },
		],
	},
};
