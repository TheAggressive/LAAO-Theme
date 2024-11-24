/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

const { state } = store('laao/mobile-nav', {
	state: {},
	actions: {
		toggleMenu() {
			const ctx = getContext();
			ctx.isActive = !ctx.isActive;

			if (ctx.isActive) {
				document.body.classList.add('laao-mobile-nav-open');
			} else {
				document.body.classList.remove('laao-mobile-nav-open');
			}
		},
	},
});
