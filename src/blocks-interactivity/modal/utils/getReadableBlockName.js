import { select } from '@wordpress/data';

/**
 * Retrieves a human-readable name for a block based on its type and attributes.
 *
 * @param {string} type - The default block type name to fall back to.
 * @param {Object} block - The block object to get the name for.
 * @param {string} block.name - The registered name of the block.
 * @param {Object} block.attributes - The block's attributes.
 * @returns {string} The human-readable block name.
 */
export const getReadableBlockName = (type, block) => {
	/**
	 * Get the block type information from the blocks registry.
	 * @type {Object|undefined}
	 */
	const blockTypeFromRegistry = select('core/blocks').getBlockType(
		block.name
	);

	// Special handling for core/group blocks
	if (block.name === 'core/group') {
		const layout = block.attributes.layout || {};
		if (layout.type === 'grid') return 'Grid';
		if (layout.type === 'flex') {
			if (layout.orientation === 'horizontal') return 'Row';
			if (layout.orientation === 'vertical') return 'Stack';
		}
	}

	/**
	 * Get all registered variations for this block type.
	 * @type {Array|undefined}
	 */
	const variations = select('core/blocks').getBlockVariations(block.name);
	let variantName = '';

	// Check if block matches any registered variations
	if (variations?.length) {
		/**
		 * Find the first variation that matches all attributes of the block.
		 * @type {Object|undefined}
		 */
		const matchingVariation = variations.find((variation) => {
			return Object.entries(variation.attributes || {}).every(
				([key, value]) => block.attributes[key] === value
			);
		});

		if (matchingVariation) {
			variantName = matchingVariation.title;
		}
	}

	return variantName || blockTypeFromRegistry?.title || type;
};
