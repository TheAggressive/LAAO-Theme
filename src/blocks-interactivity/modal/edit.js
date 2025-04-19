/**
 * Modal block edit component.
 *
 * @module src/blocks-interactivity/modal/edit
 */

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Icon,
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	Tooltip,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon } from '@wordpress/icons';
import './editor.css';
import { cleanupAllHighlights, highlightModalTrigger } from './highlights';
import { useTriggerManagement } from './hooks/useTriggerManagement';
import { useUpdateBlockTriggerClass } from './hooks/useUpdateBlockTriggerClass';
import { copyTextFallback } from './utils/copyTextFallback';
import { Debug } from './utils/debug';
import {
	blockExists,
	isEditorReady,
	manageHighlight,
	safeUpdateTriggerClass,
} from './utils/editorHelpers';
import { generatePersistentId } from './utils/generatePersistentId';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param {Object}   props               - Block properties
 * @param {Object}   props.attributes    - Block attributes
 * @param {Function} props.setAttributes - Function to set block attributes
 * @param {string}   props.clientId      - Block client ID
 * @param {boolean}  props.isSelected    - Whether the block is selected
 * @return {Element} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	clientId,
	isSelected,
}) {
	const {
		position = 'center',
		openOnLoad = false,
		modalId = '',
		triggerBlockId = '',
		triggerBlockKey = '',
		triggerLabel = 'Open Modal',
	} = attributes;

	const updateBlockTriggerClass = useUpdateBlockTriggerClass();

	// Component state
	const [isHighlightActive, setIsHighlightActive] = useState(false);
	const previousHighlightedElements = useRef(new Set());
	const lastSelectedBlock = useRef(null);

	// Create safe values (never null)
	const safePosition = position || 'center';

	// Use the trigger management hook
	const { availableTriggers, safeTriggerBlockId, handleTriggerBlockChange } =
		useTriggerManagement({
			modalId,
			triggerBlockId,
			triggerBlockKey,
			setAttributes,
			updateBlockTriggerClass,
		});

	// Initialize modal ID once
	useEffect(() => {
		if (!modalId) {
			// Generate a new ID
			const newModalId = generatePersistentId();
			setAttributes({ modalId: newModalId });
			Debug.add(`Generated new modal ID: ${newModalId}`);
		} else {
			// If we already have a modal ID, log it
			Debug.add(`Using existing modal ID: ${modalId}`);

			// If we have a saved trigger block ID, ensure the class is applied to it
			if (safeTriggerBlockId) {
				// Make sure the trigger class is applied to the block
				updateBlockTriggerClass(safeTriggerBlockId, modalId, true);
				Debug.add(
					`Ensured class modal-trigger-${modalId} is applied to block ${safeTriggerBlockId}`
				);
			}
		}
	}, [modalId, setAttributes, safeTriggerBlockId, updateBlockTriggerClass]);

	// Handle highlighting when selection changes
	useEffect(() => {
		// Skip if editor isn't ready
		if (!isEditorReady()) {
			return;
		}

		// First make sure the trigger class is applied correctly
		safeUpdateTriggerClass(
			updateBlockTriggerClass,
			safeTriggerBlockId,
			modalId,
			true
		);

		// Apply or clean up highlights based on selection state
		manageHighlight({
			modalId,
			blockId: safeTriggerBlockId,
			isSelected,
			setIsHighlightActive,
			previousHighlightedElements: previousHighlightedElements.current,
		});

		// Clean up when unmounting
		return () => cleanupAllHighlights();
	}, [isSelected, safeTriggerBlockId, modalId, updateBlockTriggerClass]);

	// Add a global selection change listener to ensure highlights are cleaned up
	useEffect(() => {
		// Don't bother if we don't have a trigger block
		if (!safeTriggerBlockId) {
			return;
		}

		// Subscribe to selection changes in the block editor
		const { subscribe } = wp.data;
		if (!subscribe) {
			return;
		}

		const unsubscribe = subscribe(() => {
			// Skip if editor isn't ready
			if (!isEditorReady()) {
				return;
			}

			// First check if the trigger block still exists using our utility
			if (!blockExists(safeTriggerBlockId)) {
				return;
			}

			const blockEditor = wp.data.select('core/block-editor');
			const selectedBlockId = blockEditor?.getSelectedBlockClientId();

			// Skip if selection hasn't changed
			if (selectedBlockId === lastSelectedBlock.current) {
				return;
			}

			// Update our tracking ref
			lastSelectedBlock.current = selectedBlockId;

			// If the selected block exists and it's not our modal or a parent of our modal
			if (selectedBlockId && selectedBlockId !== clientId) {
				// Check if this block or any of its parents is our modal
				let isParentOfModal = false;
				const parentIds = blockEditor?.getBlockParents(clientId);

				if (parentIds && parentIds.includes(selectedBlockId)) {
					isParentOfModal = true;
				}

				// If it's not our modal or a parent of our modal, and we're showing a highlight,
				// clean up all highlights
				if (!isParentOfModal && isHighlightActive) {
					cleanupAllHighlights();
					setIsHighlightActive(false);
				}
			}
		});

		// Clean up subscription when component unmounts
		return () => {
			unsubscribe();
		};
	}, [safeTriggerBlockId, clientId, isHighlightActive, setAttributes]);

	/**
	 * Refresh the trigger highlight manually
	 */
	const handleRefreshHighlight = useCallback(() => {
		// Only refresh the highlight if the modal is selected
		if (isSelected && safeTriggerBlockId) {
			// Verify the trigger block still exists
			const blockEditor = wp.data.select('core/block-editor');
			const blockStillExists =
				blockEditor && blockEditor.getBlock(safeTriggerBlockId);

			if (!blockStillExists) {
				Debug.add(
					`Trigger block ${safeTriggerBlockId} no longer exists - cannot highlight`,
					true
				);
				// Clear the highlight state since the block no longer exists
				setIsHighlightActive(false);
				return;
			}

			// Cleanup existing highlights first
			cleanupAllHighlights();

			// Make sure the trigger class is still applied
			try {
				updateBlockTriggerClass(safeTriggerBlockId, modalId, true);
			} catch (error) {
				Debug.add(
					`Error refreshing trigger class: ${error.message}`,
					true
				);
				return;
			}

			// Use the direct highlighting function
			setTimeout(() => {
				try {
					highlightModalTrigger(null, modalId, safeTriggerBlockId, {
						discreet: true,
					});
					setIsHighlightActive(true);

					// Store any newly highlighted elements
					document
						.querySelectorAll('.modal-highlight-target')
						.forEach((el) => {
							previousHighlightedElements.current.add(el);
						});
				} catch (error) {
					Debug.add(
						`Error highlighting trigger: ${error.message}`,
						true
					);
					setIsHighlightActive(false);
				}
			}, 100);
		} else if (!isSelected) {
			// If the modal is not selected, inform the user
			Debug.add('Cannot refresh highlight when modal is not selected');
		} else if (!safeTriggerBlockId) {
			Debug.add('No trigger block is selected to highlight');
		}
	}, [safeTriggerBlockId, modalId, isSelected, updateBlockTriggerClass]);

	/**
	 * Render the inspector controls
	 *
	 * @return {JSX.Element} Inspector controls
	 */
	const renderInspectorControls = () => (
		<InspectorControls>
			<PanelBody title={__('Modal Settings', 'laao')} initialOpen={true}>
				{/* Modal ID */}
				<TextControl
					label={__('Modal ID', 'laao')}
					value={modalId}
					onChange={(value) => setAttributes({ modalId: value })}
					help={__(
						'Unique identifier for this modal. Used to link triggers to this modal.',
						'laao'
					)}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{/* Position */}
				<SelectControl
					label={__('Modal Position', 'laao')}
					value={safePosition}
					options={[
						{ label: __('Center', 'laao'), value: 'center' },
						{ label: __('Top Left', 'laao'), value: 'top-left' },
						{ label: __('Top Right', 'laao'), value: 'top-right' },
						{
							label: __('Bottom Left', 'laao'),
							value: 'bottom-left',
						},
						{
							label: __('Bottom Right', 'laao'),
							value: 'bottom-right',
						},
					]}
					onChange={(value) => setAttributes({ position: value })}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{/* Open on load */}
				<ToggleControl
					label={__('Open on Page Load', 'laao')}
					checked={openOnLoad}
					onChange={(value) => setAttributes({ openOnLoad: value })}
					help={__(
						'When enabled, the modal will automatically open when the page loads',
						'laao'
					)}
					__nextHasNoMarginBottom
				/>

				{/* Trigger block select */}
				<SelectControl
					label={__('Trigger Block', 'laao')}
					value={safeTriggerBlockId}
					options={availableTriggers}
					onChange={handleTriggerBlockChange}
					help={__('Select a block to trigger this modal', 'laao')}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{/* Show highlight status */}
				{isHighlightActive && safeTriggerBlockId && isSelected && (
					<Notice status="info" isDismissible={false}>
						{__(
							'Trigger block is highlighted in the editor',
							'laao'
						)}
					</Notice>
				)}

				{/* Show message when not selected */}
				{safeTriggerBlockId && !isSelected && (
					<Notice status="warning" isDismissible={false}>
						{__(
							'Select this modal to highlight the trigger block',
							'laao'
						)}
					</Notice>
				)}

				{/* Refresh highlight button */}
				{safeTriggerBlockId && (
					<Tooltip
						text={
							!isSelected
								? __(
										'Select the modal first to use this button',
										'laao'
									)
								: ''
						}
					>
						<div>
							<Button
								variant="secondary"
								onClick={handleRefreshHighlight}
								className="refresh-highlight-button"
								disabled={!isSelected}
							>
								{__('Refresh Highlight', 'laao')}
							</Button>
						</div>
					</Tooltip>
				)}

				{/* Trigger label (only if no block selected) */}
				{!safeTriggerBlockId && (
					<TextControl
						label={__('Trigger Button Label', 'laao')}
						value={triggerLabel}
						onChange={(value) =>
							setAttributes({ triggerLabel: value })
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				)}
			</PanelBody>

			{/* Manual connection panel */}
			<PanelBody
				title={__('Manual Connection', 'laao')}
				initialOpen={false}
			>
				<p>
					{__(
						'To connect any HTML element to this modal, add this class:',
						'laao'
					)}
				</p>
				{modalId && (
					<>
						<code className="modal-connection-code">
							modal-trigger-{modalId}
						</code>
						<p className="modal-connection-example">
							{__('Example:', 'laao')}
							<br />
							<code>{`<a href="#" class="modal-trigger-${modalId}">Open Modal</a>`}</code>
						</p>
						<Button
							variant="secondary"
							onClick={() => {
								const textToCopy = `modal-trigger-${modalId}`;
								// Check if the Clipboard API is available
								if (
									navigator &&
									navigator.clipboard &&
									navigator.clipboard.writeText
								) {
									navigator.clipboard
										.writeText(textToCopy)
										.catch(() => {
											// Fallback to textarea method if writeText fails
											copyTextFallback(textToCopy);
										});
								} else {
									// Fallback method using a temporary textarea
									copyTextFallback(textToCopy);
								}
							}}
						>
							{__('Copy to Clipboard', 'laao')}
						</Button>
					</>
				)}
			</PanelBody>
		</InspectorControls>
	);

	// Block props
	const blockProps = useBlockProps({
		className: `modal-block modal-position-${safePosition}`,
	});

	return (
		<>
			{renderInspectorControls()}

			<div {...blockProps}>
				<div className="modal-editor-wrapper">
					<div className="modal-editor-content">
						<InnerBlocks
							template={[
								[
									'core/heading',
									{
										level: 3,
										content: __('Modal Title', 'laao'),
									},
								],
								[
									'core/paragraph',
									{
										content: __(
											'Add your modal content here…',
											'laao'
										),
									},
								],
							]}
							templateLock={false}
						/>
					</div>

					<div className="modal-editor-footer">
						<div className="modal-position-indicator">
							<span>
								{__('Position:', 'laao')}{' '}
								{safePosition.charAt(0).toUpperCase() +
									safePosition.slice(1)}
							</span>
						</div>

						{openOnLoad && (
							<div className="modal-auto-open-indicator">
								<span>
									{__(
										'Opens Automatically on Page Load',
										'laao'
									)}
								</span>
							</div>
						)}

						{safeTriggerBlockId ? (
							<div>
								<span>
									<Icon icon={linkIcon} size={14} />
									{__('Has Trigger Block', 'laao')}{' '}
								</span>
							</div>
						) : (
							<div>
								<span>
									{__('Trigger Label:', 'laao')}{' '}
									{triggerLabel}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
