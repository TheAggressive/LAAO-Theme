/**
 * WordPress dependencies
 */
import { getContext, store } from "@wordpress/interactivity";

const { state } = store('laao/event-gallery', {
	state: {
		isLightboxActive: false,
	},
	actions: {
		showLightbox: () => {
			const context = getContext();
			state.isLightboxActive = true;

			// Stores the positions of the scroll to fix it until the overlay is
			// closed.
			state.scrollTopReset = document.documentElement.scrollTop;
			state.scrollLeftReset = document.documentElement.scrollLeft;

		},
		hideLightbox: () => {
			const context = getContext();
			state.isLightboxActive = false;
		},
		handleKeydown(event) {
			if (event.key === 'Escape') {
				state.isLightboxActive = false;
			}
		},
		handleScroll(event) {
			// Prevents scrolling behaviors that trigger content shift while the
			// lightbox is open. It would be better to accomplish through CSS alone,
			// but using overflow: hidden is currently the only way to do so and
			// that causes a layout to shift and prevents the zoom animation from
			// working in some cases because it's not possible to account for the
			// layout shift when doing the animation calculations. Instead, it uses
			// JavaScript to prevent and reset the scrolling behavior.
			if (state.isLightboxActive) {
				// Avoids overriding the scroll behavior on mobile devices because
				// doing so breaks the pinch to zoom functionality, and users should
				// be able to zoom in further on the high-res image.
				// It doesn't rely on `event.preventDefault()` to prevent scrolling
				// because the scroll event can't be canceled, so it resets the
				// position instead.

				window.scrollTo(
					state.scrollLeftReset,
					state.scrollTopReset
				);
			}
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
