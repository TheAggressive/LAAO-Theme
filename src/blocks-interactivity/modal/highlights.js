/**
 * Highlight and visual feedback for modal trigger blocks.
 *
 * Public surface for the editor: given a modal id and a selected trigger
 * block, draw attention to that block in the canvas, and tear it down again.
 *
 * Split across ./highlights/: registry.js owns the shared collections,
 * findBlockDomElement.js resolves a clientId to a node, cleanup.js undoes
 * everything. The lookup and cleanup helpers are re-exported here so existing
 * imports from './highlights' keep working.
 */

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { select } from '@wordpress/data';

import { Debug } from './utils';
import { cleanupAllHighlights, removeHighlight } from './highlights/cleanup';
import { findBlockDomElement } from './highlights/findBlockDomElement';
import {
	highlightData,
	highlightedElements,
	styleElements,
} from './highlights/registry';

export { cleanupAllHighlights, removeHighlight, findBlockDomElement };

/**
 * Global function to add animation to a trigger element
 * This can be called from anywhere in the codebase
 *
 * @param {HTMLElement|null} triggerElement         The DOM element to highlight or null to find by ID
 * @param {string}           modalId                The modal ID
 * @param {string}           selectedTriggerBlockId The client ID of the trigger block
 * @param {Object}           [options]              Optional settings for the highlight
 * @param {boolean}          [options.discreet]     Whether to use a discreet highlight style
 */
export const highlightModalTrigger = (
	triggerElement,
	modalId,
	selectedTriggerBlockId,
	_options = {}
) => {
	// Remove any existing highlight first
	cleanupAllHighlights(modalId);

	Debug.add(`Attempting to highlight trigger for modal ${modalId}`);
	Debug.add(`Trigger block ID: ${selectedTriggerBlockId}`);

	// If no trigger element provided, try to find it by ID
	if (!triggerElement && selectedTriggerBlockId) {
		Debug.add(
			`No trigger element provided, searching for ${selectedTriggerBlockId}`
		);

		// Search for the element in the editor canvas
		const blockElement = findBlockDomElement(selectedTriggerBlockId);

		if (blockElement) {
			Debug.add('Found block element in editor canvas');

			// Make sure the element has the correct modal-trigger class
			// This check helps ensure the DOM reflects the block attributes
			if (!blockElement.className.includes(`modal-trigger-${modalId}`)) {
				Debug.add(
					`Adding missing modal-trigger-${modalId} class to element`
				);
				blockElement.classList.add(`modal-trigger-${modalId}`);
			}

			// First try to find a specific trigger inside the block (button, link, etc.).
			// No initialiser: the if/else below assigns on every path.
			let targetElement;

			// Look for a button element or link inside the block
			const buttonOrLink = blockElement.querySelector(
				'a, button, .wp-block-button__link, [role="button"]'
			);
			if (buttonOrLink) {
				Debug.add('Found button or link inside the block');
				targetElement = buttonOrLink;
			} else {
				// If no specific trigger element found, use the block itself
				Debug.add('Using block element itself as target');
				targetElement = blockElement;
			}

			// Make sure to track the block element itself too for complete cleanup
			highlightedElements.add(blockElement);

			// Create standard highlight with the selected target
			const highlightInfo = createDirectHighlight(targetElement, modalId);

			if (highlightInfo) {
				// Store for cleanup

				// Track which elements were highlighted in this session
				if (targetElement) {
					highlightedElements.add(targetElement);
				}

				return {
					highlighted: true,
					element: targetElement,
				};
			}
		} else {
			Debug.add(
				`Could not find block element for ID: ${selectedTriggerBlockId}`
			);
		}
	} else if (triggerElement) {
		// Use the provided element directly
		Debug.add('Using provided trigger element');

		// Create direct highlight with the provided element
		const highlightInfo = createDirectHighlight(triggerElement, modalId);

		if (highlightInfo) {
			// Store for cleanup

			// Track the element
			highlightedElements.add(triggerElement);

			return {
				highlighted: true,
				element: triggerElement,
			};
		}
	}

	Debug.add('Could not highlight modal trigger');
	return {
		highlighted: false,
		element: null,
	};
};

/**
 * Finds a trigger element within a block
 *
 * @param {HTMLElement} blockElement - The block element to search within
 * @param {string}      modalId      - The modal ID to find triggers for
 * @return {HTMLElement|null} The trigger element or null if not found
 */
export const findTriggerElement = (blockElement, modalId) => {
	if (!blockElement) {
		return null;
	}

	// Look for elements with the modal-trigger-{modalId} class
	const triggerClass = `modal-trigger-${modalId}`;
	const directElement = blockElement.querySelector(`.${triggerClass}`);

	if (directElement) {
		return directElement;
	}

	// Check if the block element itself has the class
	if (blockElement.classList.contains(triggerClass)) {
		return blockElement;
	}

	// Special case for buttons, links, and other possible triggers
	const potentialTriggers = [
		...blockElement.querySelectorAll(
			'a, button, .wp-block-button__link, [role="button"]'
		),
	];

	if (potentialTriggers.length === 1) {
		return potentialTriggers[0];
	}

	return null;
};

/**
 * Highlights a trigger block for a modal
 *
 * @param {string}  triggerBlockId The client ID of the trigger block
 * @param {string}  modalId        The ID of the modal being triggered
 * @param {boolean} showPulse      Whether to add a pulse animation
 * @param {string}  tooltipText    Text to show in the tooltip
 */
export const highlightTriggerBlock = (
	triggerBlockId,
	modalId,
	showPulse = true,
	tooltipText = ''
) => {
	// Clean up any existing highlights first
	cleanupAllHighlights();

	if (!triggerBlockId || !modalId) {
		return;
	}

	// Find the block element
	const blockElement = findBlockDomElement(triggerBlockId);
	if (!blockElement) {
		Debug.add(
			`Could not find block element with ID: ${triggerBlockId}`,
			true
		);
		return;
	}

	// Find the trigger element within the block
	let triggerElement = findTriggerElement(blockElement, modalId);

	// If no specific trigger found, use the block element itself
	if (!triggerElement) {
		triggerElement = blockElement;
	}

	// Get position of the trigger
	const rect = triggerElement.getBoundingClientRect();
	const scrollX = window.scrollX || document.documentElement.scrollLeft;
	const scrollY = window.scrollY || document.documentElement.scrollTop;

	// Create highlight element
	const highlight = document.createElement('div');
	highlight.className = 'modal-trigger-highlight';
	highlight.style.width = `${rect.width}px`;
	highlight.style.height = `${rect.height}px`;
	highlight.style.top = `${rect.top + scrollY}px`;
	highlight.style.left = `${rect.left + scrollX}px`;
	highlight.style.borderColor = '#007cba';
	highlight.style.backgroundColor = 'rgba(0, 124, 186, 0.1)';
	document.body.appendChild(highlight);
	highlightData.highlights.push(highlight);

	// Add tooltip if text is provided
	if (tooltipText) {
		const tooltip = document.createElement('div');
		tooltip.className = 'modal-trigger-tooltip';
		tooltip.textContent = tooltipText;
		tooltip.style.left = `${rect.left + scrollX + rect.width / 2}px`;
		tooltip.style.top = `${rect.top + scrollY}px`;
		tooltip.style.backgroundColor = '#007cba';
		tooltip.style.color = '#ffffff';
		document.body.appendChild(tooltip);
		highlightData.tooltips.push(tooltip);
	}

	// Add pulse effect if requested
	if (showPulse) {
		const pulse = document.createElement('div');
		pulse.className = 'modal-trigger-pulse';
		pulse.style.width = `${rect.width}px`;
		pulse.style.height = `${rect.height}px`;
		pulse.style.top = `${rect.top + scrollY}px`;
		pulse.style.left = `${rect.left + scrollX}px`;
		pulse.style.borderColor = '#007cba';
		pulse.style.boxShadow = '0 0 15px rgba(0, 124, 186, 0.7)';
		document.body.appendChild(pulse);
		highlightData.pulseElements.push(pulse);
	}

	// Set up resize observer to update position
	highlightData.resizeObserver = new ResizeObserver(() => {
		// Only update if elements still exist
		if (triggerElement && document.body.contains(triggerElement)) {
			const newRect = triggerElement.getBoundingClientRect();
			const newScrollX =
				window.scrollX || document.documentElement.scrollLeft;
			const newScrollY =
				window.scrollY || document.documentElement.scrollTop;

			// Update highlight position
			highlightData.highlights.forEach((el) => {
				el.style.width = `${newRect.width}px`;
				el.style.height = `${newRect.height}px`;
				el.style.top = `${newRect.top + newScrollY}px`;
				el.style.left = `${newRect.left + newScrollX}px`;
			});

			// Update pulse position
			highlightData.pulseElements.forEach((el) => {
				el.style.width = `${newRect.width}px`;
				el.style.height = `${newRect.height}px`;
				el.style.top = `${newRect.top + newScrollY}px`;
				el.style.left = `${newRect.left + newScrollX}px`;
			});

			// Update tooltip position
			highlightData.tooltips.forEach((el) => {
				el.style.left = `${newRect.left + newScrollX + newRect.width / 2}px`;
				el.style.top = `${newRect.top + newScrollY}px`;
			});
		}
	});

	highlightData.resizeObserver.observe(document.body);

	// Set up scroll listener to update position
	const scrollListener = () => {
		if (triggerElement && document.body.contains(triggerElement)) {
			const newRect = triggerElement.getBoundingClientRect();
			const newScrollX =
				window.scrollX || document.documentElement.scrollLeft;
			const newScrollY =
				window.scrollY || document.documentElement.scrollTop;

			// Update highlight position
			highlightData.highlights.forEach((el) => {
				el.style.top = `${newRect.top + newScrollY}px`;
				el.style.left = `${newRect.left + newScrollX}px`;
			});

			// Update pulse position
			highlightData.pulseElements.forEach((el) => {
				el.style.top = `${newRect.top + newScrollY}px`;
				el.style.left = `${newRect.left + newScrollX}px`;
			});

			// Update tooltip position
			highlightData.tooltips.forEach((el) => {
				el.style.left = `${newRect.left + newScrollX + newRect.width / 2}px`;
				el.style.top = `${newRect.top + newScrollY}px`;
			});
		}
	};

	window.addEventListener('scroll', scrollListener, { passive: true });
	highlightData.eventListeners.push({
		element: window,
		eventType: 'scroll',
		callback: scrollListener,
	});

	// Auto cleanup after a delay
	const timer = setTimeout(() => {
		cleanupAllHighlights();
	}, 10000); // 10 seconds

	highlightData.timers.push(timer);
};

/**
 * Refreshes the highlight on the modal trigger
 *
 * @param {string} triggerBlockId - Block ID containing the trigger
 * @param {string} modalId        - ID of the modal being triggered
 */
export const refreshHighlight = (triggerBlockId, modalId) => {
	highlightTriggerBlock(triggerBlockId, modalId, true, 'Modal Trigger');
};

/**
 * Gets information about a block by client ID
 *
 * @param {string} clientId - Block client ID
 * @return {Object} Block information
 */
export const getBlockInfo = (clientId) => {
	if (!clientId) {
		return null;
	}

	const blockEditor = select(blockEditorStore);
	if (!blockEditor) {
		return null;
	}

	const block = blockEditor.getBlock(clientId);
	if (!block) {
		return null;
	}

	return {
		name: block.name,
		attributes: block.attributes,
		clientId: block.clientId,
	};
};

/**
 * Creates a direct highlight on the element itself using CSS classes
 *
 * @param {HTMLElement} targetElement Element to highlight
 * @param {string}      modalId       Modal ID for reference
 * @return {Object} Information about the highlight for cleanup
 */
export const createDirectHighlight = (targetElement, modalId) => {
	if (!targetElement) {
		Debug.add('Cannot create direct highlight - no target element', true);
		return null;
	}

	// Clean up any existing highlights first to avoid multiples
	cleanupAllHighlights(modalId);

	// Remove any lingering highlight styles that might be cached
	document
		.querySelectorAll('style[id^="modal-direct-highlight-style-"]')
		.forEach((el) => el.remove());

	Debug.add('Creating direct highlight on element');

	try {
		// Track this element for precise cleanup later
		highlightedElements.add(targetElement);

		// Store original styles to restore later
		const originalStyles = {
			position: targetElement.style.position,
			zIndex: targetElement.style.zIndex,
			outline: targetElement.style.outline,
			outlineOffset: targetElement.style.outlineOffset,
			boxShadow: targetElement.style.boxShadow,
			animation: targetElement.style.animation,
			className: targetElement.className,
		};

		// Add specific classes for highlighting
		targetElement.classList.add(
			'modal-highlight-target',
			'no-layout-shift'
		);

		// Apply blue highlight styles directly with !important to override any existing styles
		targetElement.style.setProperty(
			'outline',
			'3px solid #007cba',
			'important'
		);
		targetElement.style.setProperty('outline-offset', '3px', 'important');
		targetElement.style.setProperty(
			'box-shadow',
			'0 0 15px rgba(0, 124, 186, 0.7)',
			'important'
		);
		targetElement.style.setProperty('position', 'relative', 'important');
		targetElement.style.setProperty('z-index', '1000', 'important');

		// Create and add animation style with a unique ID based on timestamp
		const styleTagId = `modal-direct-highlight-style-${modalId}-${Date.now()}`;
		const styleTag = document.createElement('style');
		styleTag.id = styleTagId;
		styleTag.innerHTML = `
			@keyframes modal-highlight-pulse-${modalId} {
				0% { outline-color: #007cba !important; box-shadow: 0 0 15px rgba(0, 124, 186, 0.7) !important; }
				50% { outline-color: #4ca8d8 !important; box-shadow: 0 0 25px rgba(0, 124, 186, 0.9) !important; }
				100% { outline-color: #007cba !important; box-shadow: 0 0 15px rgba(0, 124, 186, 0.7) !important; }
			}

			.modal-highlight-target {
				position: relative !important;
				z-index: 1000 !important;
				animation: modal-highlight-pulse-${modalId} 1.5s infinite !important;
				outline: 3px solid #007cba !important;
				outline-offset: 3px !important;
				box-shadow: 0 0 15px rgba(0, 124, 186, 0.7) !important;
			}

			.no-layout-shift {
				margin: 0 !important;
				padding: 0 !important;
			}
		`;

		document.head.appendChild(styleTag);
		styleElements.set(styleTagId, styleTag);

		// Apply the animation explicitly
		targetElement.style.setProperty(
			'animation',
			`modal-highlight-pulse-${modalId} 1.5s infinite`,
			'important'
		);

		// Scroll the element into view
		setTimeout(() => {
			// Only scroll if the element isn't already in view
			const rect = targetElement.getBoundingClientRect();
			const isInView =
				rect.top >= 0 &&
				rect.left >= 0 &&
				rect.bottom <=
					(window.innerHeight ||
						document.documentElement.clientHeight) &&
				rect.right <=
					(window.innerWidth || document.documentElement.clientWidth);

			if (!isInView) {
				targetElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
				Debug.add('Scrolled element into view');
			} else {
				Debug.add('Element already in view, no scrolling needed');
			}
		}, 50);

		Debug.add('Direct blue highlight applied successfully');

		// Return highlight info for cleanup and reference
		return {
			targetElement,
			styleTag,
			originalStyles,
		};
	} catch (error) {
		Debug.add(`Error in createDirectHighlight: ${error.message}`, true);
		return null;
	}
};
