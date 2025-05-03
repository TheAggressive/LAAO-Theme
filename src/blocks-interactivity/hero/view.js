/**
 * WordPress dependencies
 */
import { getContext, store } from '@wordpress/interactivity';

const { state, actions } = store('laao/hero', {
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

			state.isTransitioning = true;
			state.currentSlide =
				(state.currentSlide + 1) % state.context.totalSlides;

			// Set caption after changing the slide
			actions.setCaption();

			setTimeout(() => {
				state.isTransitioning = false;
			}, 1000); // Short transition time for slide change effect
		},
		init: () => {
			state.context = getContext();

			// Set initial caption for the first slide
			actions.setCaption();

			// Start the slideshow with a reasonable interval
			setInterval(() => {
				actions.nextSlide();
			}, state.transitionDuration); // Use the defined transition duration
		},
	},
	callbacks: {
		isActive: () => {
			const context = getContext();
			return state.currentSlide === context.slideIndex;
		},
	},
});
