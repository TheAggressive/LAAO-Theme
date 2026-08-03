/**
 * Highlight teardown.
 *
 * Removes every artefact highlighting can create: injected elements, inline
 * styles, classes, timers, listeners and observers — in the main document and
 * in each editor iframe. Cleanup is deliberately exhaustive rather than
 * targeted, because a stray highlight left in the editor is both visible and
 * impossible for the user to clear.
 */

import { Debug } from '../utils';
import {
	animationTimers,
	eventListeners,
	highlightData,
	highlightElements,
	highlightedElements,
	styleElements,
	HIGHLIGHT_CLASS_SELECTORS,
} from './registry';

/**
 * Utility function to remove all highlight styles and elements
 *
 * @param {string} modalId Optional modalId to target specific cleanup
 */
export const cleanupAllHighlights = (modalId = null) => {
	// Clear all animation timers
	animationTimers.forEach((timer) => clearInterval(timer));
	animationTimers.clear();

	// Remove all event listeners (module-level map)
	eventListeners.forEach((listener) => {
		document.removeEventListener('keydown', listener);
	});
	eventListeners.clear();

	// Remove event listeners tracked in highlightData
	highlightData.eventListeners.forEach(({ element, eventType, callback }) => {
		element.removeEventListener(eventType, callback);
	});
	highlightData.eventListeners = [];

	// Clear timers tracked in highlightData
	highlightData.timers.forEach((timer) => clearTimeout(timer));
	highlightData.timers = [];

	// Disconnect resize observer
	if (highlightData.resizeObserver) {
		highlightData.resizeObserver.disconnect();
		highlightData.resizeObserver = null;
	}

	// Remove appended DOM elements (highlights, tooltips, pulse rings)
	[
		...highlightData.highlights,
		...highlightData.tooltips,
		...highlightData.pulseElements,
	].forEach((el) => el?.parentNode?.removeChild(el));
	highlightData.highlights = [];
	highlightData.tooltips = [];
	highlightData.pulseElements = [];

	// First pass: elements carrying highlight classes, in a given document.
	const findAndCleanElements = (rootElement = document) => {
		// Create a combined selector for all highlight elements
		const allHighlightSelector = HIGHLIGHT_CLASS_SELECTORS.join(',');

		// Find elements with highlight classes
		rootElement
			.querySelectorAll(allHighlightSelector)
			.forEach((element) => {
				Debug.add(`Cleaning up highlight element: ${element.tagName}`);

				// Remove highlight classes
				HIGHLIGHT_CLASS_SELECTORS.forEach((selector) => {
					// Remove the . from the selector
					const className = selector.substring(1);
					element.classList.remove(className);
				});

				// Reset all highlight-related styles
				element.style.outline = '';
				element.style.outlineOffset = '';
				element.style.boxShadow = '';
				element.style.animation = '';
				element.style.zIndex = '';
				element.style.border = '';
				element.style.position = '';
				element.style.background = '';

				// Add to our tracked set for future reference
				highlightedElements.add(element);
			});

		// For modal-trigger classes, handle specifically if a modalId is provided
		// Removing modal-trigger classes should happen at the attribute level in edit.js
		// This is just a safety cleanup for the DOM
		if (modalId) {
			rootElement
				.querySelectorAll(`[class*="modal-trigger-${modalId}"]`)
				.forEach((element) => {
					if (
						element.className &&
						element.className.includes(`modal-trigger-${modalId}`)
					) {
						const newClasses = element.className
							.split(' ')
							.filter((cls) => cls !== `modal-trigger-${modalId}`)
							.join(' ');
						element.className = newClasses;

						Debug.add(
							`Removed specific modal-trigger-${modalId} class from element`
						);
					}
				});
		}
	};

	// Clean elements in main document
	findAndCleanElements(document);

	// Also clean elements in editor iframes
	try {
		// Check in site editor iframe
		const siteEditorIframe = document.querySelector(
			'iframe[name="editor-canvas"]'
		);
		if (siteEditorIframe?.contentDocument) {
			findAndCleanElements(siteEditorIframe.contentDocument);
		}

		// Check other editor iframes too
		document
			.querySelectorAll(
				'.edit-site-visual-editor iframe, .edit-site-canvas iframe'
			)
			.forEach((iframe) => {
				if (iframe?.contentDocument) {
					findAndCleanElements(iframe.contentDocument);
				}
			});
	} catch (error) {
		Debug.add(
			`Error cleaning up highlights in iframe: ${error.message}`,
			true
		);
	}

	// Second pass: elements tracked explicitly in the registry.
	highlightElements.forEach((element) => {
		if (element && document.contains(element)) {
			// Reset all highlight-related styles
			element.style.outline = '';
			element.style.outlineOffset = '';
			element.style.boxShadow = '';
			element.style.animation = '';
			element.style.zIndex = '';
			element.style.border = '';
			element.style.position = '';
			element.style.background = '';

			// Remove all highlight classes
			HIGHLIGHT_CLASS_SELECTORS.forEach((selector) => {
				// Remove the . from the selector
				const className = selector.substring(1);
				element.classList.remove(className);
			});
		}
	});

	// Clear our tracking maps
	highlightElements.clear();
	styleElements.clear();

	// Remove any style tags we've added
	document
		.querySelectorAll('style[id^="modal-direct-highlight-style-"]')
		.forEach((styleTag) => {
			styleTag.parentNode?.removeChild(styleTag);
		});

	// Remove any debug elements that might have been added
	document.querySelectorAll('.modal-highlight-debug').forEach((el) => {
		el.parentNode?.removeChild(el);
	});

	// Final pass: Look for elements that still have highlight styles by computed style
	// This is a more aggressive approach to ensure nothing is missed
	try {
		const allElements = document.querySelectorAll('*');
		for (const element of allElements) {
			const computedStyle = window.getComputedStyle(element);
			// Check if this element has blue outline or box-shadow that might be from our highlights
			if (
				computedStyle.outline?.includes('rgb(0, 124, 186)') || // Blue outline
				computedStyle.boxShadow?.includes('rgb(0, 124, 186)') // Blue shadow
			) {
				Debug.add(
					`Found element with highlight styles via computed style`
				);
				element.style.outline = '';
				element.style.boxShadow = '';
				element.style.animation = '';
			}
		}
	} catch (error) {
		Debug.add(`Error in final cleanup pass: ${error.message}`, true);
	}
};

// For convenience, create an alias for cleanupAllHighlights.
export const removeHighlight = cleanupAllHighlights;
