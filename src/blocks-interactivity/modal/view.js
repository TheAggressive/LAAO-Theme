/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store('laao/modal', {
	state: {
		isOpen: false,
	},
	actions: {
		toggle: () => {
			state.isOpen = !state.isOpen;
			if (state.isOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		},
		close: () => {
			state.isOpen = false;
			document.body.style.overflow = '';
		},
		handleEscape: ({ event }) => {
			if (event.key === 'Escape') {
				state.isOpen = false;
				document.body.style.overflow = '';
			}
		},
	},
});
