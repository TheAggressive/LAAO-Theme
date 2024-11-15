/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from '@wordpress/interactivity';

// Invert the value of a CSS variable
const invertValue = (value) => {
	const [_, num = 0, unit = '%'] = value?.match(/(-?\d+)(px|%)/) || [];
	return -num + unit;
};

const { state, actions } = store('laao/animate-on-scroll', {
	state: {
		isVisible: false,
		elementRef: null,
		intersectionRatio: 0,
		entryHeight: 0,
		get getLinePosition() {
			return state.entryHeight * state.ctx.threshold;
		},
	},
	actions: {
		debugRootMarginOverlay: () => {
			// Extract and normalize rootMargin values for all four sides
			// This ensures all values are valid CSS units (either % or px)
			// If a value is invalid or missing, it defaults to '0%'
			const { top, right, bottom, left } = Object.entries(
				state.ctx.rootMargin
			).reduce(
				(acc, [key, value]) => ({
					...acc,
					[key]:
						// If value ends with % or px, keep it as-is
						// Otherwise default to '0%'
						value?.endsWith('%') || value?.endsWith('px')
							? value
							: '0%',
				}),
				// Initial values if nothing is provided
				{ top: '0%', right: '0%', bottom: '0%', left: '0%' }
			);

			// Create rootMargin Overlay (only once)
			if (
				!document.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-root-margin-overlay`
				)
			) {
				const debugRootMarginOverlay = document.createElement('div');
				debugRootMarginOverlay.className = `wp-block-laao-animate-on-scroll-debug-root-margin-overlay`;

				document.body.appendChild(debugRootMarginOverlay);
			}

			// Set CSS variables for Debug rootMargin Overlay
			document.documentElement.style.cssText += `
					--wp-block-laao-animate-on-scroll-root-margin-overlay-bottom: ${invertValue(bottom)};
					--wp-block-laao-animate-on-scroll-root-margin-overlay-left: ${invertValue(left)};
					--wp-block-laao-animate-on-scroll-root-margin-overlay-right: ${invertValue(right)};
					--wp-block-laao-animate-on-scroll-root-margin-overlay-top: ${invertValue(top)};
					`;
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
		debugIntersectionLine: () => {
			// Get the overlay container
			const debugContentContainer = document.querySelector(
				`.wp-block-laao-animate-on-scroll-debug-container-${state.ctx.id}`
			);

			// Add intersection line indicator to the overlay
			const debugIntersectionLine = document.createElement('div');
			debugIntersectionLine.className = `wp-block-laao-animate-on-scroll-debug-intersection-line-${state.ctx.id}`;

			// Set CSS variables for Debug Intersection Line
			debugIntersectionLine.style.cssText = `
			--wp-block-laao-animate-on-scroll-debug-intersection-line-top: calc(${parseInt(state.getLinePosition)}px);
			`;

			// Create the label for the intersection line
			const debugIntersectionLineLabel = document.createElement('div');
			debugIntersectionLineLabel.className = `wp-block-laao-animate-on-scroll-debug-intersection-line-label-${state.ctx.id}`;
			debugIntersectionLineLabel.style.cssText = `
				--wp-block-laao-animate-on-scroll-debug-intersection-line-label-top: ${parseInt(state.getLinePosition)}px;
			`;

			// Add the visibility trigger text to the label
			debugIntersectionLineLabel.textContent = `Visibility Trigger: ${state.ctx.threshold * 100}%`;

			// Add the indicators to the overlay container
			debugContentContainer.appendChild(debugIntersectionLine);
			debugContentContainer.appendChild(debugIntersectionLineLabel);

			// Make sure the target element is positioned relative
			state.elementRef.style.position = 'relative';
		},
		updateDebugIntersectionLine: (ctx) => {
			// Calculate the top offset of the intersection element
			const elementTopOffset = `${state.getLinePosition}px`;

			// Set the CSS variable for the intersection line
			document
				.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-intersection-line-${ctx.id}`
				)
				.style.setProperty(
					'--wp-block-laao-animate-on-scroll-debug-intersection-line-top',
					elementTopOffset
				);

			// Set the CSS variable for the intersection line label
			document
				.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-intersection-line-label-${ctx.id}`
				)
				.style.setProperty(
					'--wp-block-laao-animate-on-scroll-debug-intersection-line-label-top',
					elementTopOffset
				);
		},
		debug: (ctx) => {
			// If debug mode is enabled, create overlays for debugging
			if (state.ctx.debugMode === true) {
				actions.debugRootMarginOverlay();
				actions.debugContentContainer();
				actions.debugIntersectionLine(ctx);
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
						// When element crosses the visibility threshold (e.g., 50% visible)
						if (entry.intersectionRatio >= ctx.threshold) {
							ctx.isVisible = true;
							ctx.intersectionRatio = entry.intersectionRatio;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					threshold: ctx.threshold,
					rootMargin: `${ctx.rootMargin.top} ${ctx.rootMargin.right} ${ctx.rootMargin.bottom} ${ctx.rootMargin.left}`,
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

				actions.updateDebugIntersectionLine(ctx);
			}
		},
	},
});
