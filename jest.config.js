/**
 * Jest configuration.
 *
 * Extends the wp-scripts unit preset. Test discovery is pinned to src/ so a
 * built bundle under dist/ or a stray file in node_modules can never become
 * test input.
 */

const jestConfig = require('@wordpress/scripts/config/jest-unit.config.js');

module.exports = {
	...jestConfig,
	rootDir: __dirname,
	roots: ['<rootDir>/src'],
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/__tests__/**',
		'!src/**/*.{test,spec}.{js,jsx,ts,tsx}',
	],
};
