/**
 * Block DOM lookup.
 *
 * Resolving a clientId to a DOM node is not a single query: the block editor
 * renders inside iframes (site editor canvas, template part editors), and a
 * block may be reachable only through a fallback attribute. This walks those
 * cases in order of likelihood.
 */

import { Debug } from '../utils';

/**
 * Find a block's DOM element by clientId
 *
 * @param {string} clientId - ClientId to find DOM element for
 * @return {Element|null} - DOM element or null if not found
 */
export const findBlockDomElement = (clientId) => {
	if (!clientId) {
		Debug.add('findBlockDomElement: No clientId provided', true);
		return null;
	}

	// Try direct approach first - this will catch most cases
	let blockElement = document.querySelector(`[data-block="${clientId}"]`);

	// Verify element is in editor content area if found
	if (blockElement) {
		const isInEditor =
			blockElement.closest('.editor-styles-wrapper') ||
			blockElement.closest('.edit-site-visual-editor') ||
			blockElement.closest('.editor-canvas') ||
			blockElement.closest('.edit-post-visual-editor');

		if (isInEditor) {
			return blockElement;
		}
	}

	// If not found directly or not in editor, try template parts and iframes
	Debug.add(`Looking for block ${clientId} in iframes (template parts)`);

	// Collect all possible editor iframes
	const editorIframes = [
		// Site editor canvas
		...Array.from(
			document.querySelectorAll('iframe[name="editor-canvas"]')
		),
		// Template part editor frames and template editor frames
		...Array.from(
			document.querySelectorAll('.edit-site-visual-editor iframe')
		),
		...Array.from(document.querySelectorAll('.edit-site-canvas iframe')),
		// Block editor iframes
		...Array.from(document.querySelectorAll('iframe.components-sandbox')),
	];

	// Try to find the block in each iframe
	for (const iframe of editorIframes) {
		try {
			// Skip iframes without contentDocument access
			if (!iframe.contentDocument) {
				continue;
			}

			// Try finding in this iframe
			const iframeDoc = iframe.contentDocument;
			blockElement = iframeDoc.querySelector(
				`[data-block="${clientId}"]`
			);

			// If found in this iframe, return it
			if (blockElement) {
				Debug.add(
					`Found block ${clientId} in iframe: ${iframe.name || 'unnamed'}`
				);
				return blockElement;
			}

			// Try alternative selectors as fallbacks
			const alternativeSelectors = [
				`[id="${clientId}"]`,
				`[data-id="${clientId}"]`,
				`[data-block-id="${clientId}"]`,
				`[id*="${clientId}"]`,
				`[class*="${clientId}"]`,
			];

			for (const selector of alternativeSelectors) {
				blockElement = iframeDoc.querySelector(selector);
				if (blockElement) {
					Debug.add(
						`Found block ${clientId} using alternative selector: ${selector}`
					);
					return blockElement;
				}
			}
		} catch (error) {
			Debug.add(`Error accessing iframe: ${error.message}`, true);
		}
	}

	// Final fallback - look for link or button with the clientId in a custom attribute
	Debug.add(`Fallback: looking for link or button with ${clientId}`);

	const allElements = document.querySelectorAll(
		`[data-wp-block-linkage="${clientId}"], [data-block-linkage="${clientId}"]`
	);

	if (allElements.length > 0) {
		Debug.add(`Found block using linkage attribute: ${clientId}`);
		return allElements[0];
	}

	// Try accessing the WordPress data store to get block info
	try {
		const blockEditor = window.wp?.data?.select('core/block-editor');
		if (blockEditor) {
			const blockInfo = blockEditor.getBlock(clientId);
			if (blockInfo) {
				Debug.add(
					`Block exists in store but can't find DOM element: ${clientId}`
				);
				Debug.add(
					`Block type: ${blockInfo.name}, is valid: ${blockEditor.isBlockValid(clientId)}`
				);
			}
		}
	} catch (error) {
		Debug.add(`Error accessing block store: ${error.message}`, true);
	}

	Debug.add(`Could not find DOM element for block: ${clientId}`, true);
	return null;
};
