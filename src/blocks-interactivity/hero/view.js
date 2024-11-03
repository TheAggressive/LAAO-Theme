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
		setCaption: () => {
			const captionElement = document.querySelector(
				'.wp-block-laao-hero-caption'
			);
			// Get all slides' contexts
			const slideContexts = document.querySelectorAll(
				'.wp-block-laao-hero-slide'
			);
			// Find the active slide's context
			const activeSlideContext = JSON.parse(
				slideContexts[state.currentSlide].dataset.wpContext
			);

			captionElement.innerHTML = activeSlideContext.caption;
		},
		nextSlide: () => {
			if (state.isTransitioning) {
				return;
			}

			actions.setCaption();

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
