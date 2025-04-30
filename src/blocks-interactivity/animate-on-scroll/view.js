/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from '@wordpress/interactivity';

// Invert the value of a CSS variable
const invertValue = (value) => {
	const [num = 0, unit = '%'] = value?.match(/(-?\d+)(px|%)/) || [];
	return -num + unit;
};

const { state, actions } = store('laao/animate-on-scroll', {
	state: {
		isVisible: false,
		elementRef: null,
		intersectionRatio: 0,
		entryHeight: 0,
		get getLinePosition() {
			return state.entryHeight * state.ctx.visibilityTrigger;
		},
	},
	actions: {
		debugDetectionBoundaryOverlay: () => {
			const overlayId =
				'wp-block-laao-animate-on-scroll-debug-detection-boundary-overlay';
			let debugDetectionBoundaryOverlay = document.querySelector(
				`.${overlayId}`
			);

			if (!debugDetectionBoundaryOverlay) {
				debugDetectionBoundaryOverlay = document.createElement('div');
				debugDetectionBoundaryOverlay.className = overlayId;
				document.body.appendChild(debugDetectionBoundaryOverlay);
			}

			// Generate CSS variable
			const cssVariables = Object.entries(
				state.ctx.detectionBoundary
			).reduce((acc, [key, value]) => {
				const normalizedValue =
					value?.endsWith('%') || value?.endsWith('px')
						? value
						: '0%';
				return (
					acc +
					`--wp-block-laao-animate-on-scroll-detection-boundary-overlay-${key}: ${invertValue(normalizedValue)};\n`
				);
			}, '');

			// Set all CSS variables at once
			document.documentElement.style.cssText += cssVariables;
		},
		debugContentContainer: () => {
			// Create the overlay container
			const debugContentContainer = document.createElement('div');
			debugContentContainer.className = `wp-block-laao-animate-on-scroll-debug-container-${state.ctx.id}`;

			// Insert the overlay container before the target element
			state.elementRef.parentNode.insertBefore(
				debugContentContainer,
				state.elementRef
			);
		},
		debugVisibilityTriggerLine: () => {
			// Get the overlay container
			const debugContentContainer = document.querySelector(
				`.wp-block-laao-animate-on-scroll-debug-container-${state.ctx.id}`
			);
			// Set CSS variables for Debug Visibility Trigger Line & Label
			debugContentContainer.style.cssText = `
			--wp-block-laao-animate-on-scroll-debug-visibility-trigger-top: calc(${parseInt(state.getLinePosition)}px);
			`;

			// Add intersection line indicator to the overlay
			const debugVisibilityTriggerLine = document.createElement('div');
			debugVisibilityTriggerLine.className = `wp-block-laao-animate-on-scroll-debug-visibility-trigger-line-${state.ctx.id}`;

			// Create the label for the intersection line
			const debugVisibilityTriggerLineLabel =
				document.createElement('div');
			debugVisibilityTriggerLineLabel.className = `wp-block-laao-animate-on-scroll-debug-visibility-trigger-line-label-${state.ctx.id}`;

			// Add the visibility trigger text to the label
			debugVisibilityTriggerLineLabel.textContent = `Visibility Trigger: ${state.ctx.visibilityTrigger * 100}%`;

			// Add the indicators to the overlay container
			debugContentContainer.appendChild(debugVisibilityTriggerLine);
			debugContentContainer.appendChild(debugVisibilityTriggerLineLabel);

			// Make sure the target element is positioned relative
			state.elementRef.style.position = 'relative';
		},
		updateDebugVisibilityTriggerLine: (ctx) => {
			// Calculate the top offset of the intersection element
			const elementTopOffset = `${state.getLinePosition}px`;

			// Update the CSS variable for the Visibility Trigger line
			document
				.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-container-${ctx.id}`
				)
				.style.setProperty(
					'--wp-block-laao-animate-on-scroll-debug-visibility-trigger-top',
					elementTopOffset
				);
		},
		debug: (ctx) => {
			// If debug mode is enabled, create overlays for debugging
			if (state.ctx.debugMode === true) {
				actions.debugDetectionBoundaryOverlay();
				actions.debugContentContainer();
				actions.debugVisibilityTriggerLine(ctx);
			}
		},
	},
	callbacks: {
		initObserver: () => {
			const ctx = getContext();
			const { ref } = getElement();

			// Store the context and element reference
			state.ctx = ctx;
			state.elementRef = ref;
			state.entryHeight = ref.offsetHeight;

			// If stagger animation is enabled, assign each child element a sequential index
			// This index can be used in CSS animations to create cascading/staggered effects
			// where each child animates with a slight delay after the previous one
			if (ref.dataset.staggerChildren === 'true') {
				Array.from(ref.children).forEach((child, index) => {
					child.style.setProperty(
						'--wp-block-laao-animate-on-scroll-stagger-index',
						index
					);
				});
			}

			// Call the debug function to create overlays for debugging if enabled
			actions.debug(ctx);

			// Create a new Intersection Observer to detect when elements enter the viewport
			// The observer will monitor elements and trigger a callback when they become visible
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						// When element crosses the visibility trigger (e.g., 50% visible)
						if (entry.intersectionRatio >= ctx.visibilityTrigger) {
							ctx.isVisible = true;
							ctx.intersectionRatio = entry.intersectionRatio;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					threshold: ctx.visibilityTrigger,
					rootMargin: `${ctx.detectionBoundary.top} ${ctx.detectionBoundary.right} ${ctx.detectionBoundary.bottom} ${ctx.detectionBoundary.left}`,
				}
			);

			// Start observing the target element
			observer.observe(ref);

			// Clean up the observer when the component unmounts
			return () => {
				observer.disconnect();
			};
		},
		handleResize: () => {
			const ctx = getContext();
			const { ref } = getElement();
			// If debug mode is enabled, update the intersection line position
			if (ctx.debugMode === true) {
				state.entryHeight = ref.offsetHeight;

				actions.updateDebugVisibilityTriggerLine(ctx);
			}
		},
	},
});
