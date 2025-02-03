import { select } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { getReadableBlockName } from '../utils/getReadableBlockName';

/**
 * Array of block types that are considered interactive by default.
 * @type {string[]}
 */
const INTERACTIVE_TYPES = [
	'core/button',
	'core/buttons',
	'core/image',
	'core/navigation-link',
	'core/navigation-submenu',
	'core/social-link',
];

/**
 * Custom hook that processes blocks to identify interactive elements.
 *
 * @return {Function} A callback function that processes blocks and returns an array of trigger objects.
 */
export const useInteractiveBlocks = () => {
	/**
	 * Main callback function that processes blocks to identify interactive elements.
	 *
	 * @param {Array<Object>} blocks - The blocks to process
	 * @return {Array<Object>} Array of trigger objects
	 */
	return useCallback((blocks) => {
		const triggers = [];
		/** @type {Object.<string, number>} Object to track name counts for uniqueness */
		const nameCount = {};

		/**
		 * Creates a unique name for a block by appending a number if necessary.
		 *
		 * @param {string} baseName - The initial name to make unique
		 * @return {string} A unique lowercase name
		 */
		const createUniqueName = (baseName) => {
			nameCount[baseName] = (nameCount[baseName] || 0) + 1;
			return nameCount[baseName] > 1
				? `${baseName}-${nameCount[baseName]}`.toLowerCase()
				: baseName.toLowerCase();
		};

		/**
		 * Recursively processes a block and its inner blocks to identify interactive elements.
		 *
		 * @param {Object}        block               - The block to process
		 * @param {Object}        block.name          - The name of the block
		 * @param {Object}        block.clientId      - The client ID of the block
		 * @param {Object}        block.attributes    - The block's attributes
		 * @param {Array<Object>} [block.innerBlocks] - The block's inner blocks
		 * @param {Array<string>} [parents=[]]        - Array of parent block names for context
		 */
		const processBlock = (block, parents = []) => {
			const blockType = block.name.replace('core/', '');
			const blockName = getReadableBlockName(blockType, block);
			const displayName = blockName.split(' ')[0];
			const uniqueName = createUniqueName(displayName);
			const parentPath = parents.length ? ` (${parents.join('>')})` : '';

			// Check if block is interactive
			if (
				INTERACTIVE_TYPES.includes(block.name) ||
				(block.attributes &&
					(block.attributes.onClick ||
						block.attributes.href ||
						block.attributes.url))
			) {
				triggers.push({
					value: uniqueName,
					editorId: block.clientId,
					path: [...parents, block.name].join('>'),
					label: `${blockName}${parentPath}`,
				});
			}

			// Process inner blocks recursively
			if (block.innerBlocks?.length) {
				block.innerBlocks.forEach((innerBlock) => {
					processBlock(innerBlock, [...parents, blockName]);
				});
			}
		};

		// Process each block, handling template parts specially
		blocks.forEach((block) => {
			if (block.name === 'core/template-part') {
				const templatePartBlocks = select(
					'core/block-editor'
				).getBlocks(block.clientId);
				const templateName = block.attributes.slug || 'Template Part';
				const capitalizedName =
					templateName.charAt(0).toUpperCase() +
					templateName.slice(1);

				if (templatePartBlocks?.length) {
					templatePartBlocks.forEach((templateBlock) => {
						processBlock(templateBlock, [capitalizedName]);
					});
				}
			}
			processBlock(block, []);
		});

		return triggers;
	}, []);
};
