/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	store as blockEditorStore,
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param            props.clientId
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes, clientId }) {
	const blockProps = useBlockProps();

	// Get all blocks in the editor
	const { blocks, selectedBlock } = useSelect((select) => {
		const { getBlocks, getBlock } = select(blockEditorStore);
		return {
			blocks: getBlocks(),
			selectedBlock: getBlock(clientId),
		};
	}, []);

	const { updateBlockAttributes } = useDispatch(blockEditorStore);

	// Recursively get all blocks and their titles
	const getBlockOptions = (blocks, depth = 0) => {
		return blocks.reduce((options, block) => {
			// Skip the current modal block
			if (block.clientId === clientId) {
				return options;
			}

			const indent = '—'.repeat(depth);
			options.push({
				label: `${indent} ${block.name.split('/').pop()} ${block.clientId.slice(0, 4)}`,
				value: block.clientId,
			});

			if (block.innerBlocks.length) {
				options.push(...getBlockOptions(block.innerBlocks, depth + 1));
			}

			return options;
		}, []);
	};

	const blockOptions = [
		{ label: __('Select a block', 'modal'), value: '' },
		...getBlockOptions(blocks),
	];

	const handleBlockSelect = (blockClientId) => {
		if (!blockClientId) {
			return;
		}

		const triggerClass = `modal-trigger-${clientId.slice(0, 8)}`;
		const block = blocks.find((b) => b.clientId === blockClientId);

		if (block) {
			// Add the trigger class to the selected block
			updateBlockAttributes(blockClientId, {
				className: block.attributes.className
					? `${block.attributes.className} ${triggerClass}`
					: triggerClass,
			});

			// Update the modal's trigger selector
			setAttributes({ triggerSelector: `.${triggerClass}` });
		}
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Modal Settings', 'modal')}>
					<TextControl
						label={__('Trigger Selector', 'modal')}
						help={__(
							'CSS selector for elements that will trigger the modal',
							'modal'
						)}
						value={attributes.triggerSelector || ''}
						onChange={(triggerSelector) =>
							setAttributes({ triggerSelector })
						}
					/>
					<SelectControl
						label={__('Select Block to Trigger Modal', 'modal')}
						help={__(
							'Choose a block to add the trigger class to',
							'modal'
						)}
						value=""
						options={blockOptions}
						onChange={handleBlockSelect}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<div className="modal-editor-content">
					<h4>{__('Modal Content', 'modal')}</h4>
					<InnerBlocks />
				</div>
			</div>
		</>
	);
}
