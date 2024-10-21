/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: '',
	content: [
		// './src/**/*.{html,js,php,ts,jsx,tsx,css,scss}',
		'./templates/**/*.{html,js,php,ts,jsx,tsx}',
		'./patterns/**/*.{html,js,php,ts,jsx,tsx}',
		'./parts/**/*.{html,js,php,ts,jsx,tsx}',
		'./styles/**/*.{css,scss}',
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
