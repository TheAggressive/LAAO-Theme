/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state, actions } = store('laao/mobile-nav', {
	state: {
		isActive: false,
	},
	actions: {
		toggleMenu() {
			state.isActive = !state.isActive;

			if (state.isActive) {
				actions.activateMenu();
			} else {
				actions.deactivateMenu();
			}
		},
		activateMenu() {
			document.body.classList.add('laao-mobile-nav-open');
		},
		deactivateMenu() {
			document.body.classList.remove('laao-mobile-nav-open');
			document.body.classList.add('laao-mobile-nav-closing');

			setTimeout(() => {
				document.body.classList.remove('laao-mobile-nav-closing');
			}, 450);
		},
	},
	callbacks: {
		handleResize() {
			if (window.innerWidth >= 1024) {
				if (state.isActive) {
					actions.toggleMenu();
				}
			}
		},
		handleKeydown(event) {
			if (event.key === 'Escape') {
				if (state.isActive) {
					actions.toggleMenu();
				}
			}
		},
	},
});
