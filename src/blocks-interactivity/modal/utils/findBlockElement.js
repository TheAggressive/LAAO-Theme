/**
 * Finds a block element in the DOM based on block ID or trigger block client ID.
 *
 * @param {string} blockId              - The ID of the block to find.
 * @param {Document} iframeDocument     - The iframe document object to search within.
 * @param {string} triggerBlockClientId - Optional client ID of the trigger block.
 * @returns {Element|null}              - The found DOM element or null if not found.
 */
export const findBlockElement = (
	blockId,
	iframeDocument,
	triggerBlockClientId
) => {
	let element;

	if (triggerBlockClientId) {
		element = iframeDocument.querySelector(
			`[data-block="${triggerBlockClientId}"]`
		);
	}

	if (!element && blockId.includes('block-')) {
		const cleanId = blockId.replace('block-', '');
		element = iframeDocument.querySelector(`#${CSS.escape(cleanId)}`);
	}

	return element;
};
