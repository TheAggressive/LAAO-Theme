/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

const { state, actions, callbacks } = store('laao/hero', {
	state: {
		currentSlide: 0,
		transitionDuration: 8000,
		isTransitioning: false,
	},
	actions: {
		nextSlide: () => {
			if (state.isTransitioning) {
				return;
			}

			state.isTransitioning = true;
			state.currentSlide =
				(state.currentSlide + 1) % state.context.totalSlides;

			setTimeout(() => {
				state.isTransitioning = false;
			}, state.transitionDuration);
		},
		init: () => {
			state.context = getContext();
			setInterval(() => {
				actions.nextSlide();
			}, 0);
		},
	},
	callbacks: {
		isActive: () => {
			const context = getContext();
			return state.currentSlide === context.slideIndex;
		},
	},
});
