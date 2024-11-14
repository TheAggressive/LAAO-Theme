/**
 * WordPress dependencies
 */
import { getContext, getElement, store } from '@wordpress/interactivity';

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
			// Parse all margin values - keep as percentages
			const [top, right, bottom, left] = state.ctx.rootMargin
				.split(' ')
				.map((value) => {
					if (value.endsWith('%')) {
						return value;
					} else if (value.endsWith('px')) {
						return value;
					}
					return '0%';
				});

			// Create rootMargin Overlay (only once)
			if (
				!document.querySelector(
					'.wp-block-laao-animate-on-scroll-debug-root-margin-overlay'
				)
			) {
				const debugRootMarginOverlay = document.createElement('div');
				debugRootMarginOverlay.className =
					'wp-block-laao-animate-on-scroll-debug-root-margin-overlay';

				document.body.appendChild(debugRootMarginOverlay);
			}

			// Set CSS variables for Debug rootMargin Overlay
			document.documentElement.style.cssText += `
					--wp-block-laao-animate-on-scroll-margin-root-overlay-bottom: ${-parseFloat(bottom) + '%'};
					--wp-block-laao-animate-on-scroll-margin-root-overlay-left: ${-parseFloat(left) + '%'};
					--wp-block-laao-animate-on-scroll-margin-root-overlay-right: ${-parseFloat(right) + '%'};
					--wp-block-laao-animate-on-scroll-margin-root-overlay-top: ${-parseFloat(top) + '%'};
					--wp-block-laao-animate-on-scroll-margin-root-overlay-height: calc(100vh - ${-parseFloat(top) + '%'} - ${-parseFloat(bottom) + '%'});
					--wp-block-laao-animate-on-scroll-margin-root-overlay-width: calc(100vw - ${-parseFloat(left) + '%'} - ${-parseFloat(right) + '%'});
					`;
		},
		debugContentContainer: () => {
			// Create an overlay container that won't be affected by animations
			const debugContentContainer = document.createElement('div');
			debugContentContainer.className = `wp-block-laao-animate-on-scroll-debug-container-${state.ctx.id}`;

			state.elementRef.parentNode.insertBefore(
				debugContentContainer,
				state.elementRef
			);
		},
		debugIntersectionLine: () => {
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

			// Add percentage indicator to the overlay
			const debugIntersectionLineLabel = document.createElement('div');
			debugIntersectionLineLabel.className = `wp-block-laao-animate-on-scroll-debug-intersection-line-label-${state.ctx.id}`;
			debugIntersectionLineLabel.style.cssText = `
				--wp-block-laao-animate-on-scroll-debug-intersection-line-label-top: ${parseInt(state.getLinePosition)}px;
			`;

			debugIntersectionLineLabel.textContent = `Visibility Trigger: ${state.ctx.threshold * 100}%`;

			// Add the indicators to the overlay container
			debugContentContainer.appendChild(debugIntersectionLine);
			debugContentContainer.appendChild(debugIntersectionLineLabel);

			// Add the overlay container next to the target element
			state.elementRef.style.position = 'relative';
		},
		updateDebugIntersectionLine: (ctx) => {
			const intersectionElementTopOffset = `${state.entryHeight * ctx.threshold}px`;

			document
				.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-intersection-line-${ctx.id}`
				)
				.style.setProperty(
					'--wp-block-laao-animate-on-scroll-debug-intersection-line-top',
					intersectionElementTopOffset
				);

			document
				.querySelector(
					`.wp-block-laao-animate-on-scroll-debug-intersection-line-label-${ctx.id}`
				)
				.style.setProperty(
					'--wp-block-laao-animate-on-scroll-debug-intersection-line-label-top',
					intersectionElementTopOffset
				);
		},
		debug: (ctx) => {
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

			state.ctx = ctx;
			state.elementRef = ref;
			state.entryHeight = ref.offsetHeight;

			actions.debug(ctx);

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.intersectionRatio >= ctx.threshold) {
							ctx.isVisible = true;
							ctx.intersectionRatio = entry.intersectionRatio;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					threshold: ctx.threshold,
					rootMargin: ctx.rootMargin,
				}
			);

			observer.observe(ref);

			return () => {
				observer.disconnect();
			};
		},
		handleResize: () => {
			if (state.ctx.debugMode === true) {
				const ctx = getContext();
				const { ref } = getElement();

				state.entryHeight = ref.offsetHeight;

				actions.updateDebugIntersectionLine(ctx);
			}
		},
	},
});
