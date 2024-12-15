/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

const { state } = store('laao', {
	state: {
		get themeText() {
			return state.isDark ? state.darkText : state.lightText;
		},
	},
	actions: {
		toggleOpen() {
			const context = getContext();
			context.isOpen = !context.isOpen;

			if (context.isOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		},
		initializeModal() {
			const context = getContext();
			if (context.triggerSelector) {
				document
					.querySelectorAll(context.triggerSelector)
					.forEach((trigger) => {
						trigger.addEventListener('click', (e) => {
							e.preventDefault();
							context.isOpen = true;
							document.body.style.overflow = 'hidden';
						});
					});
			}
		},
		closeOnEscape(event) {
			if (event.key === 'Escape') {
				const context = getContext();
				context.isOpen = false;
				document.body.style.overflow = '';
			}
		},
	},
	callbacks: {
		logIsOpen: () => {
			const { isOpen } = getContext();
			console.log(`Is open: ${isOpen}`);
		},
		initEscapeHandler: () => {
			document.addEventListener(
				'keydown',
				store('laao').actions.closeOnEscape
			);
		},
		cleanupEscapeHandler: () => {
			document.removeEventListener(
				'keydown',
				store('laao').actions.closeOnEscape
			);
		},
	},
});
