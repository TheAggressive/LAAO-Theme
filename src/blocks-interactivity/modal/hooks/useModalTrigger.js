/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Custom hook to handle modal trigger functionality.
 *
 * @param {Object}   options               - Hook options
 * @param {Object}   options.blockProps    - Block properties
 * @param {Function} options.setAttributes - Function to update block attributes
 * @return {Object} Object containing utility functions for modal trigger handling
 */
export const useModalTrigger = ({ blockProps, setAttributes }) => {
	/**
	 * Updates block classes and attributes for modal trigger functionality.
	 *
	 * @param {string}      blockId                         - The ID of the block to update
	 * @param {Object}      options                         - Update options
	 * @param {boolean}     [options.addModalTrigger=false] - Whether to add modal trigger classes
	 * @param {string|null} [options.modalTargetId=null]    - ID of the target modal
	 */
	const updateBlockClasses = (blockId, { addModalTrigger = false }) => {
		const { getBlock } = select('core/block-editor');
		const block = getBlock(blockId);

		if (!block) {
			return;
		}

		const { updateBlockAttributes } = dispatch('core/block-editor');
		const prefix = 'modal-trigger';

		// Generate all IDs/classes using the prefix
		const uniqueClass = `${prefix}-${blockId}`;

		// Class management unified
		const classes = new Set(
			block.attributes.className?.split(' ').filter(Boolean) || []
		);

		// Remove existing trigger classes in single pass
		Array.from(classes).forEach((className) => {
			if (className.startsWith(prefix)) {
				classes.delete(className);
			}
		});

		if (addModalTrigger) {
			classes.add(uniqueClass);
		}

		// Unified attribute update
		const updatedAttributes = {
			...block.attributes,
			className: Array.from(classes).join(' '),
		};

		console.log('blockProps', blockProps);
		console.log('updatedAttributes', updatedAttributes);

		updateBlockAttributes(blockId, updatedAttributes);

		if (addModalTrigger) {
			setAttributes({
				triggerBlockId: blockId,
				triggerBlockClientId: blockId,
			});
		}
	};

	/**
	 * Handles the selection of a trigger block for the modal.
	 *
	 * @param {string} value             - Selected trigger value
	 * @param {Array}  availableTriggers - Array of available trigger options
	 * @param {Object} attributes        - Current block attributes
	 */
	const handleTriggerSelect = (value, availableTriggers, attributes) => {
		const selectedTrigger = availableTriggers.find(
			(trigger) => trigger.value === value
		);

		if (attributes.triggerBlockClientId) {
			updateBlockClasses(attributes.triggerBlockClientId, {
				addModalTrigger: false,
			});
		}

		if (selectedTrigger) {
			updateBlockClasses(selectedTrigger.editorId, {
				addModalTrigger: true,
				modalTargetId: blockProps.id,
			});

			setAttributes({
				triggerBlockId: selectedTrigger.value,
				triggerBlockClientId: selectedTrigger.editorId,
			});
		} else {
			setAttributes({
				triggerBlockId: '',
				triggerBlockClientId: '',
			});
		}
	};

	return {
		updateBlockClasses,
		handleTriggerSelect,
	};
};
