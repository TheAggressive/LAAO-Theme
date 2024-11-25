/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store('laao/mobile-nav', {
	state: {
		isActive: false,
	},
	actions: {
		toggleMenu() {
			state.isActive = !state.isActive;

			if (state.isActive) {
				document.body.classList.add('laao-mobile-nav-open');
			} else {
				document.body.classList.remove('laao-mobile-nav-open');
				document.body.classList.add('laao-mobile-nav-closing');

				setTimeout(() => {
					document.body.classList.remove('laao-mobile-nav-closing');
				}, 300);
			}
		},
	},
});
