import { useCallback, useEffect, useState } from '@wordpress/element';
import debounce from 'lodash/debounce';
import { findBlockElement } from '../utils/findBlockElement';

/**
 * Delay in milliseconds before scrolling/highlighting occurs
 * @constant {number}
 */
const SCROLL_DELAY = 100;

/**
 * CSS selector for the editor canvas element
 * @constant {string}
 */
const EDITOR_CANVAS_SELECTOR = '.edit-site-visual-editor__editor-canvas';

/**
 * Gets the bounding rectangle of an element relative to the iframe document.
 *
 * @param {HTMLElement} element        - The element to get the rect for
 * @param {Document}    iframeDocument - The iframe's document object
 * @return {HighlightRect} The element's bounding rectangle
 */
const getElementRect = (element, iframeDocument) => {
	const rect = element.getBoundingClientRect();
	return {
		top: rect.top + iframeDocument.defaultView.scrollY,
		left: rect.left + iframeDocument.defaultView.scrollX,
		width: rect.width,
		height: rect.height,
	};
};

/**
 * Updates the highlight position and scrolls to the target block.
 *
 * @callback UpdateHighlightCallback
 * @param {string|null} blockId - The ID of the block to highlight
 * @return {void}
 */

/**
 * Custom hook that manages highlighting and scrolling to a specific block element in the editor.
 *
 * @typedef {Object} HighlightProps
 * @property {string|null}    triggerBlockId                  - The ID of the block to highlight
 * @property {boolean}        isSelected                      - Whether the block is currently selected
 * @property {Object}         attributes                      - Block attributes
 * @property {string}         attributes.triggerBlockClientId - Client ID of the trigger block
 *
 * @typedef {Object} HighlightRect
 * @property {number}         top                             - Top position of the highlight
 * @property {number}         left                            - Left position of the highlight
 * @property {number}         width                           - Width of the highlight
 * @property {number}         height                          - Height of the highlight
 *
 * @param    {HighlightProps} props                           - Hook properties
 * @return {{highlightRect: HighlightRect|null}} Object containing the highlight rectangle coordinates
 */
export const useHighlight = ({ triggerBlockId, isSelected, attributes }) => {
	/**
	 * State to store the current highlight rectangle coordinates
	 * @type {[HighlightRect | null, Function]}
	 */
	const [highlightRect, setHighlightRect] = useState(null);

	/**
	 * Callback to update the highlight position and scroll to the target block
	 * @type {UpdateHighlightCallback}
	 */
	const updateHighlight = useCallback(
		(blockId) => {
			if (!blockId) {
				setHighlightRect(null);
				return;
			}

			setTimeout(() => {
				try {
					const editorCanvas = document.querySelector(
						EDITOR_CANVAS_SELECTOR
					);
					const iframeDocument = editorCanvas?.contentDocument;

					if (!iframeDocument) {
						return;
					}

					const element = findBlockElement(
						blockId,
						iframeDocument,
						attributes.triggerBlockClientId
					);

					if (element) {
						const newRect = getElementRect(element, iframeDocument);
						setHighlightRect(newRect);
						element.scrollIntoView({
							behavior: 'smooth',
							block: 'center',
						});
					}
				} catch (error) {
					setHighlightRect(null);
				}
			}, SCROLL_DELAY);
		},
		[attributes.triggerBlockClientId]
	);

	/**
	 * Effect to handle highlighting and scroll behavior
	 * Sets up scroll and resize event listeners when a block is selected
	 */
	useEffect(() => {
		const shouldHighlight = isSelected && triggerBlockId;

		if (shouldHighlight) {
			updateHighlight(triggerBlockId);
		} else {
			setHighlightRect(null);
		}

		if (triggerBlockId) {
			const debouncedUpdate = debounce(
				() => updateHighlight(triggerBlockId),
				SCROLL_DELAY
			);

			window.addEventListener('scroll', debouncedUpdate, true);
			window.addEventListener('resize', debouncedUpdate);

			return () => {
				window.removeEventListener('scroll', debouncedUpdate, true);
				window.removeEventListener('resize', debouncedUpdate);
			};
		}
	}, [isSelected, triggerBlockId, updateHighlight]);

	return { highlightRect };
};
