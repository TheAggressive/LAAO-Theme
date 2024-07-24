/**
 * WordPress dependencies
 */
import { getContext, store } from "@wordpress/interactivity";

const { state } = store('laao/event-gallery', {
	state: {
		overlayEnabled: false,
	},
	actions: {
		handleClick: () => {
			const context = getContext();
			state.overlayEnabled = !state.overlayEnabled;
			console.log(`Is active: ${state.overlayEnabled}`);
		},
	},
	callbacks: {
		logIsOpen: () => {
			const { isOpen } = getContext();
			// Log the value of `isOpen` each time it changes.
			console.log(`Is open: ${isOpen}`);
		},
	},
});
