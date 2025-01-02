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

export default function Edit({ attributes, setAttributes, isSelected }) {
	const { triggerBlockId, modalTitle } = attributes;
	const [availableTriggers, setAvailableTriggers] = useState([]);
	const [highlightRect, setHighlightRect] = useState(null);

	// Extract block selection handler
	const selectCurrentBlock = () => {
		const { selectBlock } = dispatch('core/block-editor');
		selectBlock(blockProps.id);
	};

	// Consolidated block props with event handlers
	const blockProps = useBlockProps({
		onClick: (e) => {
			e.stopPropagation();
			e.preventDefault();
			selectCurrentBlock();
		},
	});

	// Extract trigger management logic
	const handleTriggerAttributes = (blockId, attrs) => {
		const { updateBlockAttributes } = dispatch('core/block-editor');
		const { getBlock } = select('core/block-editor');
		const block = getBlock(blockId);

		// Get current block attributes
		const currentAttributes = block.attributes;
		const currentClassName = currentAttributes.className || '';
		const existingClasses = currentClassName.split(' ').filter(Boolean);

		console.log('Starting update process...');
		console.log('Current block:', block);
		console.log('Current className:', currentClassName);
		console.log('Existing classes array:', existingClasses);
		console.log('Incoming attrs:', attrs);

		if (!attrs.className) {
			// Only remove modal-trigger, keep everything else
			const updatedClassName = existingClasses
				.filter((className) => className !== 'modal-trigger')
				.join(' ');

			console.log(
				'Removing modal-trigger, new className:',
				updatedClassName
			);

			updateBlockAttributes(blockId, {
				...block.attributes,
				className: updatedClassName,
			});
		} else {
			const hasModalTrigger = existingClasses.includes('modal-trigger');

			if (!hasModalTrigger) {
				console.log('Adding modal-trigger');
				console.log('Existing classes before update:', existingClasses);

				// Combine existing classes with modal-trigger
				const updatedClasses = [...existingClasses];
				if (!updatedClasses.includes('modal-trigger')) {
					updatedClasses.push('modal-trigger');
				}

				const updatedClassName = updatedClasses.join(' ');
				console.log('Final className to be set:', updatedClassName);

				updateBlockAttributes(blockId, {
					...block.attributes,
					'data-modal-target': attrs['data-modal-target'],
					className: updatedClassName,
				});

				// Verify the update
				const finalBlock = getBlock(blockId);
				console.log('Final block state:', finalBlock.attributes);
			}
		}
	};

	const handleTriggerSelect = (value) => {
		if (triggerBlockId) {
			// When removing trigger, preserve existing classes
			const currentBlock =
				select('core/block-editor').getBlock(triggerBlockId);
			const currentClasses = currentBlock.attributes.className || '';
			handleTriggerAttributes(triggerBlockId, {
				className: currentClasses.replace('modal-trigger', '').trim(),
				'data-modal-target': undefined,
			});
		}

		if (value) {
			// When adding trigger, preserve existing classes
			const newBlock = select('core/block-editor').getBlock(value);
			const existingClasses = newBlock.attributes.className || '';
			handleTriggerAttributes(value, {
				className: existingClasses,
				'data-modal-target': blockProps.id,
			});
		}

		setAttributes({ triggerBlockId: value });
	};

	// Extract modal content component
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

	// Extract highlight overlay component
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

	const findInteractiveBlocks = useCallback((blocks, path = '') => {
		let triggers = [];

		blocks.forEach((block, index) => {
			const currentPath = path ? `${path}-${index}` : `${index}`;

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
							`${currentPath}-template-part`
						),
					];
				}
			}

			// Define interactive block types
			const interactiveTypes = [
				'core/button',
				'core/buttons',
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
				// Only include necessary properties for the select options
				triggers.push({
					value: block.clientId,
					label: `${block.name.replace('core/', '')} (${currentPath})`,
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

	useEffect(() => {
		const blocks = select('core/block-editor').getBlocks();
		const triggers = findInteractiveBlocks(blocks);
		setAvailableTriggers(triggers);
	}, [findInteractiveBlocks]);

	useEffect(() => {
		if (triggerBlockId) {
			const { updateBlockAttributes } = dispatch('core/block-editor');

			updateBlockAttributes(triggerBlockId, {
				className: 'modal-trigger',
				'data-modal-target': blockProps.id,
			});

			return () => {
				updateBlockAttributes(triggerBlockId, {
					className: '',
					'data-modal-target': undefined,
				});
			};
		}
	}, [triggerBlockId, blockProps.id]);

	// Update highlight position
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

	// Update highlight on trigger change
	useEffect(() => {
		updateHighlight(triggerBlockId);

		// Update highlight on scroll or resize
		const handleUpdate = () => updateHighlight(triggerBlockId);

		// Debounce the scroll and resize handlers
		let timeout;
		const debouncedUpdate = () => {
			clearTimeout(timeout);
			timeout = setTimeout(handleUpdate, 100);
		};

		window.addEventListener('scroll', debouncedUpdate, true);
		window.addEventListener('resize', debouncedUpdate);

		return () => {
			window.removeEventListener('scroll', debouncedUpdate, true);
			window.removeEventListener('resize', debouncedUpdate);
			clearTimeout(timeout);
		};
	}, [triggerBlockId]);

	// Only update highlight when modal is selected
	useEffect(() => {
		if (isSelected && triggerBlockId) {
			updateHighlight(triggerBlockId);
		} else {
			setHighlightRect(null);
		}
	}, [isSelected, triggerBlockId]);

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
