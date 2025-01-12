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

// Define interactive block types
const interactiveTypes = [
	'core/button',
	'core/buttons',
	'core/image',
	'core/navigation-link',
	'core/navigation-submenu',
	'core/social-link',
];

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
		let nameCount = {};

		const createUniqueName = (baseName) => {
			// Initialize counter if not exists
			nameCount[baseName] = (nameCount[baseName] || 0) + 1;
			// Add number suffix if more than one instance and lowercase the result
			return nameCount[baseName] > 1
				? `${baseName}-${nameCount[baseName]}`.toLowerCase()
				: baseName.toLowerCase();
		};

		const processBlock = (block, parents = []) => {
			// Get proper block name
			const blockType = block.name.replace('core/', '');
			const blockName = getReadableBlockName(blockType, block);
			const displayName = blockName.split(' ')[0]; // Get base name without variants
			const uniqueName = createUniqueName(displayName);
			const parentPath = parents.length ? ` (${parents.join('>')})` : '';

			// Check if block is interactive
			if (
				interactiveTypes.includes(block.name) ||
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

			// Process inner blocks
			if (block.innerBlocks?.length) {
				block.innerBlocks.forEach((innerBlock) => {
					processBlock(innerBlock, [...parents, blockName]);
				});
			}
		};

		// Process all blocks
		blocks.forEach((block) => {
			if (block.name === 'core/template-part') {
				const templatePartBlocks = select(
					'core/block-editor'
				).getBlocks(block.clientId);
				// Get template part name and capitalize first letter
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

		console.log('Generated triggers:', triggers); // Debug log
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

		console.log('Available triggers:', triggers);
		console.log('Current triggerBlockId:', attributes.triggerBlockId);

		setAvailableTriggers(triggers);
	}, [findInteractiveBlocks]);

	// Add these debug logs
	console.log('All triggers:', availableTriggers);
	console.log('Stored triggerBlockId:', attributes.triggerBlockId);

	// Update the currentValue logic
	const currentValue =
		availableTriggers.find(
			(trigger) => trigger.value === attributes.triggerBlockId
		)?.value || '';

	console.log('Current SelectControl value:', currentValue);

	/**
	 * Manages the lifecycle of modal trigger classes and attributes.
	 *
	 * When a trigger block is selected, adds the modal-trigger class and sets
	 * the data-modal-target attribute. Includes cleanup function to remove
	 * these when the trigger is deselected, changed, or component unmounts.
	 *
	 * @see updateBlockClasses
	 */
	useEffect(() => {
		if (triggerBlockId) {
			updateBlockClasses(triggerBlockId, {
				addModalTrigger: true,
				modalTargetId: blockProps.id,
			});
		}

		// Cleanup function runs when:
		// 1. Component unmounts (modal block deleted)
		// 2. triggerBlockId changes
		// 3. blockProps.id changes
		return () => {
			if (triggerBlockId) {
				updateBlockClasses(triggerBlockId, {
					addModalTrigger: false,
				});
			}
		};
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

		// Check if block exists before proceeding
		if (!block) return;

		// Generate a permanent ID if one doesn't exist
		const blockHtmlId = block.attributes.id || `block-${blockId}`;

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
			id: blockHtmlId,
			className: updatedClassName,
			'data-modal-target': modalTargetId,
			'data-wp-interactive': addModalTrigger ? 'laao/modal' : undefined,
			'data-wp-on--click': addModalTrigger ? 'actions.toggle' : undefined,
		});

		// Store both IDs in the modal block
		if (addModalTrigger) {
			setAttributes({
				triggerBlockId: blockHtmlId,
				triggerBlockClientId: blockId,
			});
		}
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
		console.log('handleTriggerSelect called with value:', value); // Debug

		const selectedTrigger = availableTriggers.find(
			(trigger) => trigger.value === value
		);
		console.log('Selected trigger:', selectedTrigger); // Debug

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
				triggerBlockId: selectedTrigger.value, // Store the unique name as the ID
				triggerBlockClientId: selectedTrigger.editorId,
			});
		} else {
			setAttributes({
				triggerBlockId: '',
				triggerBlockClientId: '',
			});
		}
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
	 * @param {string} blockId - The ID of the block to highlight.
	 */
	const updateHighlight = (blockId) => {
		if (!blockId) {
			setHighlightRect(null);
			return;
		}

		setTimeout(() => {
			const editorCanvas = document.querySelector(
				'.edit-site-visual-editor__editor-canvas'
			);
			const iframeDocument = editorCanvas?.contentDocument;

			if (!iframeDocument) {
				return;
			}

			// Try to find the block element within the iframe
			let element;

			// First try by data-block attribute (client ID)
			if (attributes.triggerBlockClientId) {
				element = iframeDocument.querySelector(
					`[data-block="${attributes.triggerBlockClientId}"]`
				);
			}

			// If not found and blockId is a valid selector, try by ID
			if (!element && blockId.includes('block-')) {
				const cleanId = blockId.replace('block-', '');
				element = iframeDocument.querySelector(
					`#${CSS.escape(cleanId)}`
				);
			}

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

	/**
	 * Gets a readable name for a block type, including variant information.
	 *
	 * @param {string} type  - The block type (e.g., 'group', 'button').
	 * @param {Object} block - The block object containing attributes and name.
	 * @return {string} A human-readable block name.
	 */
	const getReadableBlockName = (type, block) => {
		// Get block type from registry
		const blockTypeFromRegistry = select('core/blocks').getBlockType(
			block.name
		);

		// Special handling for group block layouts
		if (block.name === 'core/group') {
			const layout = block.attributes.layout || {};
			if (layout.type === 'grid') return 'Grid';
			if (layout.type === 'flex') {
				if (layout.orientation === 'horizontal') return 'Row';
				if (layout.orientation === 'vertical') return 'Stack';
			}
		}

		// Check for block variations
		const variations = select('core/blocks').getBlockVariations(block.name);
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

	// Add this console log in the main component
	console.log('Current attributes:', attributes); // Debug log

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
						value={currentValue}
						options={[
							{ label: 'Select a block...', value: '' },
							...availableTriggers.map(({ value, label }) => {
								console.log(
									`Mapping option - value: ${value}, label: ${label}`
								); // Debug each option
								return { value, label };
							}),
						]}
						onChange={(value) => {
							console.log('Selected value:', value); // Debug selection
							handleTriggerSelect(value);
						}}
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
