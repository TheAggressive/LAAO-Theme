import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { dispatch, select } from '@wordpress/data';
import {
	createPortal,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import debounce from 'lodash/debounce';

export default function Edit({ attributes, setAttributes, isSelected }) {
	const { triggerBlockId, modalTitle } = attributes;
	const [availableTriggers, setAvailableTriggers] = useState([]);
	const [highlightRect, setHighlightRect] = useState(null);
	const blockProps = useBlockProps({
		onClick: (e) => {
			e.stopPropagation();
			e.preventDefault();
			selectCurrentBlock();
		},
	});

	/**
	 * Recursively finds blocks that can be used as modal triggers.
	 *
	 * @param {Array} blocks       - Array of block objects to search through.
	 * @param {Array} [parents=[]] - Array of parent block names for path creation.
	 * @return {Array} Array of objects containing block IDs and labels for trigger selection.
	 * @return {string} return[].value - The block's client ID.
	 * @return {string} return[].label - Display label combining block type and path.
	 */
	const findInteractiveBlocks = useCallback((blocks, parents = []) => {
		let triggers = [];

		blocks.forEach((block) => {
			// Get proper block name
			const blockType = block.name.replace('core/', '');

			// Create readable block name
			const getReadableBlockName = (type, block) => {
				// Get block type from registry
				const blockTypeFromRegistry = select(
					'core/blocks'
				).getBlockType(block.name);

				// Special handling for group block layouts
				if (block.name === 'core/group') {
					const layout = block.attributes.layout || {};
					if (layout.type === 'grid') {
						return 'Grid';
					}
					if (
						layout.type === 'flex' &&
						layout.orientation === 'horizontal'
					) {
						return 'Row';
					}
					if (
						layout.type === 'flex' &&
						layout.orientation === 'vertical'
					) {
						return 'Stack';
					}
				}

				// Check for block variations
				const variations = select('core/blocks').getBlockVariations(
					block.name
				);
				let variantName = '';

				if (variations?.length) {
					// Find matching variation based on attributes
					const matchingVariation = variations.find((variation) => {
						// Check if all variation attributes match block attributes
						return Object.entries(variation.attributes || {}).every(
							([key, value]) => block.attributes[key] === value
						);
					});

					if (matchingVariation) {
						variantName = matchingVariation.title;
					}
				}

				// Use variant name if found, otherwise use block type title
				return variantName || blockTypeFromRegistry?.title || type;
			};

			const blockName = getReadableBlockName(blockType, block);
			const currentPath = [...parents, blockName];

			// Check for template parts
			if (block.name === 'core/template-part') {
				const templatePartBlocks = select(
					'core/block-editor'
				).getBlocks(block.clientId);
				if (templatePartBlocks.length) {
					triggers = [
						...triggers,
						...findInteractiveBlocks(
							templatePartBlocks,
							currentPath
						),
					];
				}
			}

			// Define interactive block types
			const interactiveTypes = [
				'core/button',
				'core/navigation-link',
				'core/image',
				'core/navigation-submenu',
			];

			// Check if block is interactive
			if (
				interactiveTypes.includes(block.name) ||
				(block.attributes &&
					(block.attributes.onClick ||
						block.attributes.href ||
						block.attributes.url))
			) {
				// Create readable path with block name first
				const parentPath = parents.length
					? ` (${parents.join('>')})`
					: '';
				const label = `${blockName}${parentPath}`;

				triggers.push({
					value: block.clientId,
					label,
				});
			}

			// Recursively check inner blocks
			if (block.innerBlocks?.length) {
				triggers = [
					...triggers,
					...findInteractiveBlocks(block.innerBlocks, currentPath),
				];
			}
		});

		return triggers;
	}, []);

	/**
	 * Updates the list of available trigger blocks in the editor.
	 *
	 * Fetches all blocks from the editor and filters for those that can be
	 * used as modal triggers. Updates the availableTriggers state which
	 * populates the trigger selection dropdown.
	 *
	 * @see findInteractiveBlocks
	 */
	useEffect(() => {
		const blocks = select('core/block-editor').getBlocks();
		const triggers = findInteractiveBlocks(blocks);
		setAvailableTriggers(triggers);
	}, [findInteractiveBlocks]);

	/**
	 * Manages the lifecycle of modal trigger classes and attributes.
	 *
	 * When a trigger block is selected, adds the modal-trigger class and sets
	 * the data-modal-target attribute. Includes cleanup function to remove
	 * these when the trigger is deselected or component unmounts.
	 *
	 * @see updateBlockClasses
	 */
	useEffect(() => {
		if (triggerBlockId) {
			updateBlockClasses(triggerBlockId, {
				addModalTrigger: true,
				modalTargetId: blockProps.id,
			});

			return () => {
				updateBlockClasses(triggerBlockId, {
					addModalTrigger: false,
				});
			};
		}
	}, [triggerBlockId, blockProps.id]);

	/**
	 * Manages highlight overlay position updates on scroll and resize.
	 *
	 * Updates the highlight position when the trigger block changes and sets up
	 * event listeners for scroll and resize events. Uses debounce to optimize
	 * performance. Includes cleanup to remove event listeners on unmount.
	 *
	 * @see updateHighlight
	 * @see debounce
	 */
	useEffect(() => {
		updateHighlight(triggerBlockId);

		const handleUpdate = () => updateHighlight(triggerBlockId);
		const debouncedUpdate = debounce(handleUpdate, 100);

		window.addEventListener('scroll', debouncedUpdate, true);
		window.addEventListener('resize', debouncedUpdate);

		return () => {
			window.removeEventListener('scroll', debouncedUpdate, true);
			window.removeEventListener('resize', debouncedUpdate);
		};
	}, [triggerBlockId]);

	/**
	 * Controls highlight visibility based on block selection.
	 *
	 * Shows the highlight overlay only when the modal block is selected and
	 * has a trigger block assigned. Removes the highlight when the block is
	 * deselected or no trigger is set.
	 *
	 * @see updateHighlight
	 */
	useEffect(() => {
		if (isSelected && triggerBlockId) {
			updateHighlight(triggerBlockId);
		} else {
			setHighlightRect(null);
		}
	}, [isSelected, triggerBlockId]);

	/**
	 * Selects the current modal block in the editor.
	 *
	 * Uses the block editor's dispatch to programmatically select this block
	 * when the modal container is clicked.
	 */
	const selectCurrentBlock = () => {
		const { selectBlock } = dispatch('core/block-editor');
		selectBlock(blockProps.id);
	};

	/**
	 * Updates the classes and attributes of a block to make it a modal trigger.
	 *
	 * @param {string}      blockId                         - The client ID of the block to update.
	 * @param {Object}      options                         - Options for updating the block.
	 * @param {boolean}     [options.addModalTrigger=false] - Whether to add or remove modal trigger classes.
	 * @param {string|null} [options.modalTargetId=null]    - The ID of the target modal block.
	 */
	const updateBlockClasses = (
		blockId,
		{ addModalTrigger = false, modalTargetId = null }
	) => {
		const { updateBlockAttributes } = dispatch('core/block-editor');
		const { getBlock } = select('core/block-editor');
		const block = getBlock(blockId);

		const currentClassName = block.attributes.className || '';
		const existingClasses = currentClassName.split(' ').filter(Boolean);

		// Create unique modal trigger class using the target modal's ID
		const uniqueModalClass = modalTargetId
			? `modal-trigger-${modalTargetId}`
			: '';

		// Remove any existing modal-trigger classes
		const cleanedClasses = existingClasses.filter(
			(className) => !className.startsWith('modal-trigger')
		);

		const updatedClassName = addModalTrigger
			? [...cleanedClasses, 'modal-trigger', uniqueModalClass].join(' ')
			: cleanedClasses.join(' ');

		updateBlockAttributes(blockId, {
			...block.attributes,
			className: updatedClassName,
			'data-modal-target': modalTargetId,
		});
	};

	/**
	 * Handles the selection of a new trigger block for the modal.
	 *
	 * Removes modal trigger classes from the previous block (if any) and adds
	 * them to the newly selected block. Updates the modal's triggerBlockId
	 * attribute to maintain the connection.
	 *
	 * @param {string} value - The client ID of the newly selected trigger block.
	 * @see updateBlockClasses
	 */
	const handleTriggerSelect = (value) => {
		if (triggerBlockId) {
			updateBlockClasses(triggerBlockId, {
				addModalTrigger: false,
			});
		}

		if (value) {
			updateBlockClasses(value, {
				addModalTrigger: true,
				modalTargetId: blockProps.id,
			});
		}

		setAttributes({ triggerBlockId: value });
	};

	/**
	 * Renders the modal content structure.
	 *
	 * Creates a dialog with header (title and close button) and body sections.
	 * The body contains an InnerBlocks component allowing for nested content.
	 *
	 * @return {JSX.Element} The modal content structure.
	 */
	const ModalContent = () => (
		<div className="modal-content" aria-modal="true" role="dialog">
			<div className="modal-header">
				<h3>{modalTitle}</h3>
				<button type="button" className="modal-close">
					×
				</button>
			</div>
			<div className="modal-body">
				<InnerBlocks />
			</div>
		</div>
	);

	/**
	 * Renders a highlight overlay for the selected modal trigger.
	 *
	 * Creates a portal to render a visual overlay that highlights the trigger block
	 * in the editor. Only renders when the modal is selected and highlight position
	 * is available. Uses createPortal to render in the editor canvas.
	 *
	 * @return {JSX.Element|null} The highlight overlay element or null if conditions aren't met.
	 */
	const HighlightOverlay = () =>
		isSelected &&
		highlightRect &&
		createPortal(
			<div
				className="modal-trigger-overlay"
				style={{
					top: `${highlightRect.top}px`,
					left: `${highlightRect.left}px`,
					width: `${highlightRect.width}px`,
					height: `${highlightRect.height}px`,
				}}
			/>,
			document.querySelector('.edit-site-visual-editor__editor-canvas')
				?.contentDocument?.body || document.body
		);

	/**
	 * Updates the position and visibility of the highlight overlay.
	 *
	 * Calculates the position of the trigger block within the editor iframe
	 * and updates the highlight rectangle state. Also handles scrolling the
	 * trigger block into view.
	 *
	 * @param {string} blockId - The client ID of the block to highlight.
	 */
	const updateHighlight = (blockId) => {
		if (!blockId) {
			setHighlightRect(null);
			return;
		}

		setTimeout(() => {
			// Get the iframe document
			const editorCanvas = document.querySelector(
				'.edit-site-visual-editor__editor-canvas'
			);
			const iframeDocument = editorCanvas?.contentDocument;

			if (!iframeDocument) {
				return;
			}

			// Try to find the block element within the iframe
			const element = iframeDocument.querySelector(
				`[data-block="${blockId}"]`
			);

			if (element) {
				const rect = element.getBoundingClientRect();

				const newRect = {
					top: rect.top + iframeDocument.defaultView.scrollY,
					left: rect.left + iframeDocument.defaultView.scrollX,
					width: rect.width,
					height: rect.height,
				};

				setHighlightRect(newRect);

				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title="Modal Settings">
					<TextControl
						label="Modal Title"
						value={modalTitle}
						onChange={(value) =>
							setAttributes({ modalTitle: value })
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label="Select Trigger Block"
						value={triggerBlockId}
						options={[
							{ label: 'Select a block...', value: '' },
							...availableTriggers,
						]}
						onChange={handleTriggerSelect}
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
					<ModalContent />
				</div>
			</div>

			<HighlightOverlay />
		</>
	);
}
