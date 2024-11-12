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
	},
	actions: {
		debug: () => {
			const elementHeight = state.elementRef.offsetHeight;

			// Calculate line position based on threshold only
			const linePosition = elementHeight * state.ctx.threshold;

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

			// Create bottom margin indicator if different (only once)
			if (
				bottom !== '0%' &&
				bottom !== '0px' &&
				!document.querySelector('.bottom-margin-indicator')
			) {
				const bottomArea = document.createElement('div');
				bottomArea.className = 'bottom-margin-indicator';
				bottomArea.style.cssText = `
					position: fixed;
					bottom: ${-parseFloat(bottom) + '%'};
					left: ${-parseFloat(left) + '%'};
					right: ${-parseFloat(right) + '%'};
					top: ${-parseFloat(top) + '%'};
					height: calc(100vh - ${-parseFloat(top) + '%'} - ${-parseFloat(bottom) + '%'});
					width: calc(100vw - ${-parseFloat(left) + '%'} - ${-parseFloat(right) + '%'});
					background-color: rgba(255, 0, 0, 0.1);
					border: 2px dashed red;
					pointer-events: none;
					z-index: 999999;
				`;
				document.body.appendChild(bottomArea);
			}

			// Create an overlay container that won't be affected by animations
			const overlayContainer = document.createElement('div');
			overlayContainer.style.cssText = `
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background-color: rgba(0, 125, 0, 0.1);
				pointer-events: none;
				z-index: 999999;
			`;

			// Add intersection line indicator to the overlay
			const intersectionLine = document.createElement('div');
			intersectionLine.style.cssText = `
				position: absolute;
				left: 0;
				right: 0;
				height: 2px;
				background-color: green;
				pointer-events: none;
				z-index: 999999;
				transform: translateY(-1px);
				top: ${linePosition}px;
			`;

			// Add percentage indicator to the overlay
			const percentageIndicator = document.createElement('div');
			percentageIndicator.style.cssText = `
				position: absolute;
				right: 0;
				background: green;
				color: white;
				padding: 2px 6px;
				font-size: 12px;
				z-index: 999999;
				transform: translateY(-50%);
				top: ${linePosition}px;
			`;

			percentageIndicator.textContent = `Trigger ${state.ctx.threshold * 100}%`;

			// Add the indicators to the overlay container
			overlayContainer.appendChild(intersectionLine);
			overlayContainer.appendChild(percentageIndicator);

			// Add the overlay container next to the target element
			state.elementRef.style.position = 'relative';
			state.elementRef.parentNode.insertBefore(
				overlayContainer,
				state.elementRef
			);
		},
	},
	callbacks: {
		initObserver: () => {
			const ctx = getContext();
			const { ref } = getElement();

			state.ctx = ctx;
			state.elementRef = ref;

			if (ctx.debugMode === true) {
				actions.debug();
			}

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
			state.ctx.entryHeight = state.elementRef.offsetHeight;
		},
	},
});
