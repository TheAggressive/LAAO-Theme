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

			// Create bottom margin indicator if different (only once)
			if (
				bottom !== '0%' &&
				bottom !== '0px' &&
				!document.querySelector('.root-margin-indicator')
			) {
				const debugRootMargin = document.createElement('div');
				debugRootMargin.className = 'root-margin-indicator';
				debugRootMargin.style.cssText = `
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
				document.body.appendChild(debugRootMargin);
			}
		},
		debugContentOverlay: () => {
			// Create an overlay container that won't be affected by animations
			const overlayContainer = document.createElement('div');
			overlayContainer.className = `debug-overlay-${state.ctx.id}`;
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

			state.elementRef.parentNode.insertBefore(
				overlayContainer,
				state.elementRef
			);
		},
		debugIntersectionLine: (ctx) => {
			const overlayContainer = document.querySelector(
				`.debug-overlay-${ctx.id}`
			);

			// Add intersection line indicator to the overlay
			const targetLine = document.createElement('div');
			targetLine.className = `debug-target-line-${ctx.id}`;
			targetLine.style.cssText = `
				--debug-target-line: ${parseInt(state.getLinePosition)}px;
				position: absolute;
				left: 0;
				right: 0;
				height: 2px;
				background-color: green;
				pointer-events: none;
				z-index: 999999;
				transform: translateY(-1px);
				top: var(--debug-target-line);
			`;

			// Add percentage indicator to the overlay
			const targetIndicator = document.createElement('div');

			targetIndicator.className = `debug-target-indicator-${ctx.id}`;
			targetIndicator.style.cssText = `
				--debug-target-indicator: ${parseInt(state.entryHeight * ctx.threshold)}px;
				position: absolute;
				right: 0;
				background: green;
				color: white;
				padding: 2px 6px;
				font-size: 12px;
				z-index: 999999;
				border-radius: 6px;
				transform: translateY(-50%);
				top: var(--debug-target-indicator);
			`;

			targetIndicator.textContent = `Trigger ${ctx.threshold * 100}%`;

			// Add the indicators to the overlay container
			overlayContainer.appendChild(targetLine);
			overlayContainer.appendChild(targetIndicator);

			// Add the overlay container next to the target element
			state.elementRef.style.position = 'relative';
		},
		updateDebugIntersectionLine: (ctx) => {
			const topIntersectionElement = `${state.entryHeight * ctx.threshold}px`;
			document
				.querySelector(`.debug-target-line-${ctx.id}`)
				.style.setProperty(
					'--debug-target-line',
					topIntersectionElement
				);

			document
				.querySelector(`.debug-target-indicator-${ctx.id}`)
				.style.setProperty(
					'--debug-target-indicator',
					topIntersectionElement
				);
		},
		debug: (ctx) => {
			if (state.ctx.debugMode === true) {
				actions.debugRootMarginOverlay();
				actions.debugContentOverlay();
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
			const ctx = getContext();
			const { ref } = getElement();
			state.entryHeight = ref.offsetHeight;

			actions.updateDebugIntersectionLine(ctx);
		},
	},
});
