import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { dispatch, select } from '@wordpress/data';
import { createPortal, useEffect, useState } from '@wordpress/element';

export default function Edit({ attributes, setAttributes }) {
	const { triggerBlockId, modalTitle } = attributes;
	const [availableTriggers, setAvailableTriggers] = useState([]);
	const [highlightRect, setHighlightRect] = useState(null);
	const blockProps = useBlockProps();

	const findInteractiveBlocks = (blocks, path = '') => {
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
	};

	useEffect(() => {
		const blocks = select('core/block-editor').getBlocks();
		const triggers = findInteractiveBlocks(blocks);
		setAvailableTriggers(triggers);
	}, []);

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
			console.log('No blockId provided');
			setHighlightRect(null);
			return;
		}

		// Log block information from the store
		const blockEditor = select('core/block-editor');
		const block = blockEditor.getBlock(blockId);
		console.log('Block from store:', block);

		setTimeout(() => {
			// Get the iframe document
			const editorCanvas = document.querySelector(
				'.edit-site-visual-editor__editor-canvas'
			);
			const iframeDocument = editorCanvas?.contentDocument;
			console.log('Editor iframe document:', iframeDocument);

			if (!iframeDocument) {
				console.log('No iframe document found');
				return;
			}

			// Try to find the block element within the iframe
			const element = iframeDocument.querySelector(
				`[data-block="${blockId}"]`
			);
			console.log('Found element in iframe:', element);

			if (element) {
				const rect = element.getBoundingClientRect();
				const canvasRect = editorCanvas.getBoundingClientRect();

				const newRect = {
					top: rect.top + iframeDocument.defaultView.scrollY,
					left: rect.left + iframeDocument.defaultView.scrollX,
					width: rect.width,
					height: rect.height,
				};

				console.log('Setting highlight rect:', newRect);
				setHighlightRect(newRect);

				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} else {
				console.log('No element found for blockId:', blockId);
				// Debug: log all blocks in the editor
				const allBlocks = blockEditor.getBlocks();
				console.log('All blocks in editor:', allBlocks);
			}
		}, 100);
	};

	// Update highlight on trigger change
	useEffect(() => {
		console.log('Trigger block ID changed:', triggerBlockId);
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

	// Add effect to monitor highlightRect changes
	useEffect(() => {
		console.log('highlightRect updated:', highlightRect);
	}, [highlightRect]);

	// Handle trigger selection
	const handleTriggerSelect = (value) => {
		setAttributes({ triggerBlockId: value });
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

			<div {...blockProps} className="wp-block-modal">
				<div className="modal-container">
					<div className="modal-content">
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
				</div>
			</div>

			{/* Updated class name to match editor.css */}
			{highlightRect &&
				createPortal(
					<div
						className="modal-trigger-overlay"
						style={{
							top: highlightRect.top + 'px',
							left: highlightRect.left + 'px',
							width: highlightRect.width + 'px',
							height: highlightRect.height + 'px',
						}}
						ref={(el) => {
							if (el) {
								console.log('Overlay element created:', {
									className: el.className,
									style: el.style,
									parent: el.parentElement,
								});
							}
						}}
					/>,
					document.querySelector(
						'.edit-site-visual-editor__editor-canvas'
					)?.contentDocument?.body || document.body
				)}
		</>
	);
}
