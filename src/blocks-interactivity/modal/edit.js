import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { dispatch, select } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { HighlightOverlay } from './components/HighlightOverlay';
import { ModalContent } from './components/ModalContent';
import { useHighlight } from './hooks/useHighlight';
import { useInteractiveBlocks } from './hooks/useInteractiveBlocks';
import { useModalTrigger } from './hooks/useModalTrigger';

/**
 * Modal block edit component.
 *
 * @param {Object} props               Component properties.
 * @param {Object} props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update block attributes.
 * @param {boolean} props.isSelected   Whether the block is currently selected.
 * @return {JSX.Element} Modal edit interface.
 */
export default function Edit({ attributes, setAttributes, isSelected }) {
	const { triggerBlockId, modalTitle = '' } = attributes;
	const [availableTriggers, setAvailableTriggers] = useState([]);

	const findInteractiveBlocks = useInteractiveBlocks();
	const { highlightRect } = useHighlight({
		triggerBlockId,
		isSelected,
		attributes,
	});

	const blockProps = useBlockProps({
		onClick: (e) => {
			e.stopPropagation();
			e.preventDefault();
			dispatch('core/block-editor').selectBlock(blockProps.id);
		},
	});

	const { updateBlockClasses, handleTriggerSelect } = useModalTrigger({
		blockProps,
		setAttributes,
	});

	/**
	 * Updates available trigger blocks when blocks change.
	 */
	useEffect(() => {
		const blocks = select('core/block-editor').getBlocks();
		const triggers = findInteractiveBlocks(blocks);
		setAvailableTriggers(triggers);
	}, [findInteractiveBlocks]);

	/**
	 * Manages modal trigger class updates when triggerBlockId changes.
	 * Adds or removes modal trigger classes from the selected trigger block.
	 */
	useEffect(() => {
		if (triggerBlockId) {
			updateBlockClasses(triggerBlockId, {
				addModalTrigger: true,
				modalTargetId: blockProps.id,
			});
		}

		return () => {
			if (triggerBlockId) {
				updateBlockClasses(triggerBlockId, {
					addModalTrigger: false,
				});
			}
		};
	}, [triggerBlockId, blockProps.id]);

	const currentValue =
		availableTriggers.find(
			(trigger) => trigger.value === attributes.triggerBlockId
		)?.value || '';

	return (
		<>
			<InspectorControls>
				<PanelBody title="Modal Settings">
					<TextControl
						label="Modal Title"
						value={modalTitle || ''}
						onChange={(value) =>
							setAttributes({ modalTitle: value })
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label="Select Trigger Block"
						value={currentValue}
						options={[
							{ label: 'Select a block...', value: '' },
							...availableTriggers.map(({ value, label }) => ({
								value,
								label,
							})),
						]}
						onChange={(value) =>
							handleTriggerSelect(
								value,
								availableTriggers,
								attributes
							)
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			<div
				{...blockProps}
				className={`wp-block-modal ${blockProps.className || ''}`}
			>
				<div className="modal-container">
					<ModalContent modalTitle={modalTitle} />
				</div>
			</div>

			<HighlightOverlay
				isSelected={isSelected}
				highlightRect={highlightRect}
			/>
		</>
	);
}
