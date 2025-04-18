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
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './editor.css';
import { cleanupAllHighlights, highlightModalTrigger } from './highlights';

/**
 * Simple debug utility for development
 */
const Debug = {
	messages: [],
	enabled: false, // Disable debug output by default

	/**
	 * Add a debug message
	 * @param {string}  message  - The message to add
	 * @param {boolean} critical - Whether this is a critical error message
	 */
	add(message, critical = false) {
		// Always log critical errors, regardless of enabled state
		if (!this.enabled && !critical) {
			return;
		}

		this.messages.push({
			time: Date.now(),
			message,
			critical,
		});

		// Log to console only if enabled or critical
		if (this.enabled || critical) {
			// eslint-disable-next-line no-console
			console.log('[Modal Debug]', message);
		}
	},

	/**
	 * Get all debug messages
	 * @return {Array} Array of debug messages
	 */
	getAll() {
		return this.messages;
	},

	/**
	 * Clear all debug messages
	 */
	clear() {
		this.messages = [];
	},
};

/**
 * Fallback function to copy text when Clipboard API is not available
 *
 * @param {string} text - The text to copy
 * @return {boolean} Whether the operation was successful
 */
const copyTextFallback = (text) => {
	// Create a temporary textarea element
	const textarea = document.createElement('textarea');
	textarea.value = text;

	// Make the textarea out of viewport
	textarea.style.position = 'fixed';
	textarea.style.left = '-999999px';
	textarea.style.top = '-999999px';

	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();

	let successful = false;
	try {
		// Execute the copy command
		successful = document.execCommand('copy');
		if (!successful) {
			Debug.add('Fallback clipboard copy failed', true);
		}
	} catch (err) {
		Debug.add(`Fallback clipboard copy error: ${err.message}`, true);
	}

	// Clean up
	document.body.removeChild(textarea);
	return successful;
};

/**
 * Removes a class with the given prefix from a className string
 *
 * @param {string} className - The original className string
 * @param {string} prefix    - The prefix to search for and remove
 * @return {string}          - The updated className string
 */
const removeClassWithPrefix = (className, prefix) => {
	if (!className) {
		return '';
	}
	return className
		.split(' ')
		.filter((cls) => !cls.startsWith(prefix))
		.join(' ');
};

/**
 * Adds or updates a class with the given prefix and value
 *
 * @param {string} className - The original className string
 * @param {string} prefix    - The prefix for the class
 * @param {string} value     - The value to append to the prefix
 * @return {string}          - The updated className string
 */
const addOrUpdateClassWithPrefix = (className, prefix, value) => {
	// First remove any existing classes with this prefix
	const cleanedClassName = removeClassWithPrefix(className, prefix);
	// Add the new class with value
	const newClass = `${prefix}${value}`;
	// Return the combined class
	return cleanedClassName ? `${cleanedClassName} ${newClass}` : newClass;
};

/**
 * Generates a unique ID that will be persistent across page refreshes
 *
 * @param {string} prefix - The prefix for the ID
 * @return {string} A unique persistent ID
 */
const generatePersistentId = (prefix = 'modal') => {
	// Get current timestamp
	const timestamp = new Date().getTime();
	// Get a random number
	const random = Math.floor(Math.random() * 10000);
	// Combine them for uniqueness
	return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate a persistent key for a block based on its content or attributes
 * This key should remain consistent across page reloads
 *
 * @param {Object} block - The block object
 * @return {string} A persistent key for the block
 */
const generateBlockKey = (block) => {
	if (!block) {
		return '';
	}

	// Check if the block already has a modalTriggerKey
	if (block.attributes?.modalTriggerKey) {
		return block.attributes.modalTriggerKey;
	}

	// Add a unique identifier attribute to the block if it doesn't have one
	const blockEditor = wp.data.select('core/block-editor');
	if (blockEditor && block.clientId) {
		// Use the dispatch function to update the block attributes
		const { updateBlockAttributes } = wp.data.dispatch('core/block-editor');
		const triggerKey = `trigger-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

		updateBlockAttributes(block.clientId, {
			modalTriggerKey: triggerKey,
		});

		return triggerKey;
	}

	return '';
};

/**
 * Find and analyze blocks to identify buttons and links as potential triggers.
 *
 * @param {boolean|Array} blocksOrIncludeFlag - Either blocks array to process or boolean flag
 * @param {string}        modalId             - The current modal ID to check for existing trigger classes
 * @return {Array} Array of potential trigger blocks
 */
const findTriggerElements = (blocksOrIncludeFlag = true, modalId = '') => {
	// Handle when called with blocks array directly (from template parts)
	const isDirectBlocksArray = Array.isArray(blocksOrIncludeFlag);
	const includeTemplatePartBlocks = isDirectBlocksArray
		? true
		: blocksOrIncludeFlag;

	// Debug
	Debug.add(
		`Finding trigger elements (blocks for dropdown) ${isDirectBlocksArray ? 'from direct blocks array' : 'from editor'}`
	);

	// Get the WordPress data API objects
	const { select } = wp.data;
	const blockEditor = select('core/block-editor');

	if (!blockEditor && !isDirectBlocksArray) {
		Debug.add('Block editor API not available', true);
		return [];
	}

	// Get blocks - either use provided array or get from editor
	const blocks = isDirectBlocksArray
		? blocksOrIncludeFlag
		: blockEditor.getBlocks();
	Debug.add(
		`Found ${blocks.length} blocks in ${isDirectBlocksArray ? 'provided array' : 'current editor context'}`
	);

	// Collection to store all trigger candidates
	const triggerCandidates = [];

	// Process the regular blocks first
	processBlocksForTriggers(
		blocks,
		triggerCandidates,
		isDirectBlocksArray,
		'',
		modalId
	);

	// If we should include template part blocks too (only when called from main context)
	if (includeTemplatePartBlocks && !isDirectBlocksArray) {
		// Try to find template part blocks in the main editor
		const templatePartBlocks = blocks.filter(
			(block) => block.name === 'core/template-part'
		);

		Debug.add(
			`Found ${templatePartBlocks.length} template part blocks in main content`
		);

		// Process each template part block directly
		templatePartBlocks.forEach((templatePartBlock) => {
			const area = templatePartBlock.attributes?.area || '';
			const slug = templatePartBlock.attributes?.slug || '';

			// If the template part block has inner blocks, process them
			if (
				templatePartBlock.innerBlocks &&
				templatePartBlock.innerBlocks.length > 0
			) {
				Debug.add(
					`Processing inner blocks (${templatePartBlock.innerBlocks.length}) of template part: ${slug || templatePartBlock.clientId}`
				);

				// Deep scan for clickable elements within this template part
				processBlocksForTriggers(
					templatePartBlock.innerBlocks,
					triggerCandidates,
					true, // These are from template part
					slug || area || 'template-part', // Prefer slug, then area, then generic name
					modalId
				);
			}
		});

		// Now try to get all available template parts from the entity store
		try {
			let templateParts = [];

			// In site editor - only access when needed
			const editSite = select('core/edit-site');
			if (
				editSite &&
				typeof editSite.getEditedEntityRecords === 'function'
			) {
				try {
					const templateEntities = editSite.getEditedEntityRecords(
						'postType',
						'wp_template_part'
					);

					if (templateEntities && templateEntities.length) {
						Debug.add(
							`Found ${templateEntities.length} template parts in site editor`
						);
						templateParts = templateParts.concat(templateEntities);
					}
				} catch (siteEditorError) {
					Debug.add(
						`Error accessing site editor: ${siteEditorError.message}`,
						true
					);
				}
			}

			// In post editor - only access when needed
			const coreEditor = select('core/editor');
			if (
				coreEditor &&
				typeof coreEditor.getEditedEntityRecords === 'function'
			) {
				try {
					const coreTemplates = coreEditor.getEditedEntityRecords(
						'postType',
						'wp_template_part'
					);

					if (coreTemplates && coreTemplates.length) {
						Debug.add(
							`Found ${coreTemplates.length} template parts in post editor`
						);
						templateParts = templateParts.concat(coreTemplates);
					}
				} catch (coreEditorError) {
					Debug.add(
						`Error accessing core editor: ${coreEditorError.message}`,
						true
					);
				}
			}

			// Process each template part's blocks
			templateParts.forEach((templatePart) => {
				if (templatePart.blocks && Array.isArray(templatePart.blocks)) {
					Debug.add(
						`Processing ${templatePart.blocks.length} blocks in template part: ${templatePart.slug || templatePart.title || 'unnamed'}`
					);
					processBlocksForTriggers(
						templatePart.blocks,
						triggerCandidates,
						true, // These are from template part
						templatePart.slug ||
							templatePart.title ||
							'template-part', // Use appropriate identification
						modalId
					);
				}
			});
		} catch (error) {
			Debug.add(`Error getting template parts: ${error.message}`, true);
		}
	}

	Debug.add(`Total trigger candidates found: ${triggerCandidates.length}`);
	return triggerCandidates;
};

/**
 * Process an array of blocks to find potential triggers
 *
 * @param {Array}   blocks           - Array of blocks to process
 * @param {Array}   results          - Array to store results
 * @param {boolean} isTemplatePart   - Whether these blocks are from a template part
 * @param {string}  templatePartSlug - The slug of the template part (if applicable)
 * @param {string}  modalId          - The current modal ID to check for existing trigger classes
 */
const processBlocksForTriggers = (
	blocks,
	results,
	isTemplatePart = false,
	templatePartSlug = '',
	modalId = ''
) => {
	if (!blocks || !Array.isArray(blocks)) {
		Debug.add('No blocks to process or invalid blocks array', true);
		return;
	}

	// Keep track of how many we find in this batch
	let foundInThisBatch = 0;

	for (const block of blocks) {
		// First check if this block has the modal-trigger class for this modal
		const blockHasTriggerClass =
			modalId &&
			block.attributes &&
			block.attributes.className &&
			block.attributes.className.includes(`modal-trigger-${modalId}`);

		// If it has the trigger class, mark it as a trigger
		if (blockHasTriggerClass) {
			Debug.add(
				`Found block with modal-trigger-${modalId} class: ${block.clientId}`
			);
			foundInThisBatch++;

			// Create a trigger object with isTrigger flag
			results.push({
				clientId: block.clientId,
				name: block.name,
				text: getBlockLabel(block),
				block,
				fromTemplatePart: isTemplatePart,
				templatePartSlug,
				type: block.name.includes('button') ? 'button' : 'link',
				isTrigger: true, // Flag this as an existing trigger
			});

			// Continue to the next block since we've already added this one
			continue;
		}

		// Regular detection logic - check if this is a button or link
		const isButton =
			block.name === 'core/button' ||
			block.name === 'core/buttons' ||
			block.name.includes('button') ||
			block.name.includes('Button');

		const isLink =
			block.name.includes('link') ||
			block.name === 'core/navigation-link' ||
			block.name === 'core/navigation-submenu' ||
			(block.attributes && block.attributes.linkTarget) ||
			(block.attributes && block.attributes.url);

		if (isButton || isLink) {
			foundInThisBatch++;
			// Add to our results
			results.push({
				clientId: block.clientId,
				name: block.name,
				text: getBlockLabel(block),
				block,
				fromTemplatePart: isTemplatePart,
				templatePartSlug,
				type: isButton ? 'button' : 'link',
				isTrigger: false, // Not an existing trigger
			});
		}

		// Check for core/paragraph blocks with links inside them
		if (
			block.name === 'core/paragraph' &&
			block.attributes &&
			block.attributes.content
		) {
			const content = block.attributes.content;
			if (content && content.includes('<a ')) {
				foundInThisBatch++;
				results.push({
					clientId: block.clientId,
					name: block.name,
					text: 'Link in ' + getBlockLabel(block),
					block,
					fromTemplatePart: isTemplatePart,
					templatePartSlug,
					type: 'link',
					isTrigger: false,
				});
			}
		}

		// Special handling for navigation blocks which can contain many links
		if (block.name === 'core/navigation') {
			foundInThisBatch++;
			results.push({
				clientId: block.clientId,
				name: block.name,
				text: 'Navigation Menu',
				block,
				fromTemplatePart: isTemplatePart,
				templatePartSlug,
				type: 'link',
				isTrigger: false,
			});
		}

		// Check inner blocks recursively
		if (block.innerBlocks && block.innerBlocks.length > 0) {
			processBlocksForTriggers(
				block.innerBlocks,
				results,
				isTemplatePart,
				templatePartSlug,
				modalId
			);
		}
	}

	if (isTemplatePart && foundInThisBatch > 0) {
		Debug.add(
			`Found ${foundInThisBatch} trigger elements in ${templatePartSlug}`
		);
	}
};

/**
 * Get a human readable label for a block
 *
 * @param {Object} block - The block to get a label for
 * @return {string} A label for the block
 */
const getBlockLabel = (block) => {
	// Always return empty string for missing blocks
	if (!block) {
		return '';
	}

	// Try to find a meaningful label based on block type
	let label = '';

	if (block.name === 'core/button') {
		// For buttons, use the text content
		label = block.attributes?.text || 'Button';
	} else if (block.name === 'core/paragraph') {
		// For paragraphs, use a trimmed version of the content
		const content = block.attributes?.content || '';
		// Strip HTML tags and trim
		const plainText = content.replace(/<[^>]*>/g, '').trim();
		// Truncate if too long
		label =
			plainText.length > 30
				? plainText.substring(0, 30) + '...'
				: plainText || 'Paragraph';
	} else if (block.name === 'core/heading') {
		// For headings, use the content
		const content = block.attributes?.content || '';
		// Strip HTML tags and trim
		const plainText = content.replace(/<[^>]*>/g, '').trim();
		// Truncate if too long
		label =
			plainText.length > 30
				? plainText.substring(0, 30) + '...'
				: plainText || 'Heading';
	} else if (block.name === 'core/navigation-link') {
		// For navigation links, use the label
		label = block.attributes?.label || 'Navigation Link';
	} else if (block.name === 'core/image') {
		// For images, use the alt text or a generic label
		label = block.attributes?.alt || 'Image';
	} else {
		// Default to the block name for other blocks
		label = block.name.replace('core/', '').replace(/-/g, ' ');
		// Capitalize first letter of each word
		label = label
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	return label;
};

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
	// eslint-disable-next-line no-unused-vars
	clientId,
	isSelected,
}) {
	// clientId is passed by WordPress but not used in this component

	const {
		position = 'center',
		openOnLoad = false,
		modalId = '',
		triggerBlockId = '',
		// triggerBlockKey is used in dependencies and triggers detection
		// eslint-disable-next-line no-unused-vars
		triggerBlockKey = '',
		triggerLabel = 'Open Modal',
	} = attributes;

	// Get the update function from the store for use in updateBlockTriggerClass
	const { updateBlockAttributes } = useDispatch('core/block-editor');

	/**
	 * Updates a block's className to include or remove a trigger class
	 *
	 * @param {string}  blockId  - The block ID to update
	 * @param {string}  modalVal - The modal ID for the trigger class
	 * @param {boolean} add      - Whether to add or remove the class
	 */
	const updateBlockTriggerClass = useCallback(
		(blockId, modalVal, add = true) => {
			if (!blockId) {
				Debug.add('updateBlockTriggerClass: Missing blockId', true);
				return;
			}

			// Check if the block exists first
			const blockEditor = wp.data.select('core/block-editor');

			// Get the block itself first to verify it exists
			const block = blockEditor.getBlock(blockId);

			if (!block) {
				Debug.add(`Block ${blockId} not found in editor`, true);
				return;
			}

			// Get the block's current attributes
			const blockAttributes = blockEditor.getBlockAttributes(blockId);

			if (!blockAttributes) {
				Debug.add(
					`Could not get attributes for block ${blockId}`,
					true
				);
				// Still attempt to get attributes directly from the block object as fallback
				if (block.attributes) {
					Debug.add(
						`Using attributes from block object as fallback`,
						true
					);
					const currentClassName = block.attributes.className || '';

					// Continue with the class update using the block object's attributes
					if (!add) {
						// Remove all modal-trigger classes regardless of modal ID
						const cleanedClassName = currentClassName
							.split(' ')
							.filter((cls) => !cls.startsWith('modal-trigger-'))
							.join(' ');

						try {
							updateBlockAttributes(blockId, {
								className: cleanedClassName,
							});
							Debug.add(
								`Removed modal trigger classes using fallback method`
							);
						} catch (error) {
							Debug.add(
								`Failed to update block: ${error.message}`,
								true
							);
						}
					} else {
						// Add the new class
						const updatedClassName = addOrUpdateClassWithPrefix(
							currentClassName,
							'modal-trigger-',
							modalVal
						);

						// Only update if the class has actually changed
						if (updatedClassName !== currentClassName) {
							try {
								updateBlockAttributes(blockId, {
									className: updatedClassName,
								});
								Debug.add(
									`Added modal-trigger class using fallback method`
								);
							} catch (error) {
								Debug.add(
									`Failed to update block: ${error.message}`,
									true
								);
							}
						}
					}
					return;
				}
				return;
			}

			// Get the current className or empty string
			const currentClassName = blockAttributes.className || '';

			// If removing, strip all modal-trigger classes, not just one specific class
			if (!add) {
				// Remove all modal-trigger classes regardless of modal ID
				const cleanedClassName = currentClassName
					.split(' ')
					.filter((cls) => !cls.startsWith('modal-trigger-'))
					.join(' ');

				Debug.add(
					`Removing all modal trigger classes from block ${blockId}`
				);
				try {
					updateBlockAttributes(blockId, {
						className: cleanedClassName,
					});
				} catch (error) {
					Debug.add(
						`Failed to update block attributes: ${error.message}`,
						true
					);
				}
			} else {
				// Add the new class
				const updatedClassName = addOrUpdateClassWithPrefix(
					currentClassName,
					'modal-trigger-',
					modalVal
				);

				// Only update if the class has actually changed
				if (updatedClassName !== currentClassName) {
					Debug.add(
						`Adding modal-trigger-${modalVal} class to block ${blockId}`
					);
					try {
						updateBlockAttributes(blockId, {
							className: updatedClassName,
						});
					} catch (error) {
						Debug.add(
							`Failed to update block attributes: ${error.message}`,
							true
						);
					}
				}
			}
		},
		[updateBlockAttributes]
	);

	// Component state
	const [triggers, setTriggers] = useState([]);
	const [isHighlightActive, setIsHighlightActive] = useState(false);
	const previousTriggerBlockId = useRef(triggerBlockId);
	// Store the previously highlighted elements to ensure proper cleanup
	const previousHighlightedElements = useRef(new Set());

	// Get block editor data, including template parts
	const { blocks, templateParts } = useSelect((select) => {
		const blockEditor = select('core/block-editor');

		// Get the main blocks
		const mainBlocks = blockEditor.getBlocks();

		// Get information about template parts being used
		// This will help us identify template part blocks
		const allTemplateParts = [];

		// Find all template-part blocks in the current editor
		const templatePartBlocks = [];

		// Helper function to recursively find template part blocks
		const findTemplatePartBlocks = (blocksToSearch) => {
			blocksToSearch.forEach((block) => {
				if (block.name === 'core/template-part') {
					templatePartBlocks.push(block);
				}

				// Recursively search inner blocks
				if (block.innerBlocks && block.innerBlocks.length > 0) {
					findTemplatePartBlocks(block.innerBlocks);
				}
			});
		};

		// Search the main blocks for template parts
		findTemplatePartBlocks(mainBlocks);

		// For each template part block, get its content if available
		templatePartBlocks.forEach((templateBlock) => {
			try {
				// The template part area and slug can help identify it
				const area = templateBlock.attributes.area || '';
				const slug = templateBlock.attributes.slug || '';
				const theme = templateBlock.attributes.theme || '';

				// Template parts can have their own inner blocks
				const innerBlocks =
					blockEditor.getBlocks(templateBlock.clientId) || [];

				allTemplateParts.push({
					clientId: templateBlock.clientId,
					area,
					slug,
					theme,
					innerBlocks,
				});
			} catch (e) {
				Debug.add(`Error processing template part: ${e.message}`, true);
			}
		});

		return {
			blocks: mainBlocks,
			templateParts: allTemplateParts,
		};
	}, []);

	// Create safe values (never null)
	const safePosition = position || 'center';
	const safeTriggerBlockId = triggerBlockId || '';

	// Debug the saved trigger ID on every render
	Debug.add(`Current saved triggerBlockId: ${safeTriggerBlockId}`);

	// Create a basic definition for availableTriggers
	const availableTriggers = [
		{ label: __('— Select a trigger —', 'modal'), value: '' },
	];

	// Add options from the triggers state if available
	if (triggers && triggers.length > 0) {
		// Get the block editor to verify blocks
		const blockEditor = wp.data.select('core/block-editor');

		triggers.forEach((trigger) => {
			// Skip triggers that don't have a valid clientId
			if (!trigger.clientId) {
				return;
			}

			// Verify the block still exists (if we have access to the editor)
			if (blockEditor) {
				const blockExists = blockEditor.getBlock(trigger.clientId);
				if (!blockExists) {
					Debug.add(
						`Trigger candidate ${trigger.clientId} no longer exists - skipping`,
						true
					);
					return;
				}
			}

			let label = trigger.text || 'Unnamed trigger';

			// Add icon based on trigger type
			if (trigger.type === 'button') {
				label = `📄 ${label} (Button)`;
			} else if (trigger.type === 'link') {
				label = `🔗 ${label} (Link)`;
			}

			// Add template part info if available
			if (trigger.fromTemplatePart && trigger.templatePartSlug) {
				label = `${label} [${trigger.templatePartSlug}]`;
			}

			availableTriggers.push({
				label,
				value: trigger.clientId,
			});
		});
	}

	// Check if the saved trigger block still exists when the component loads
	useEffect(() => {
		if (safeTriggerBlockId) {
			const blockEditor = wp.data.select('core/block-editor');
			if (!blockEditor) {
				return;
			}

			const triggerBlockExists = blockEditor.getBlock(safeTriggerBlockId);

			if (!triggerBlockExists) {
				Debug.add(
					`Saved trigger block ${safeTriggerBlockId} no longer exists, clearing reference`,
					true
				);
				// Clear the trigger block reference since it no longer exists
				setAttributes({
					triggerBlockId: '',
				});
				// Also update the ref to avoid cleanup attempts on a non-existent block
				previousTriggerBlockId.current = null;
				// Clean up highlight state
				setIsHighlightActive(false);
				cleanupAllHighlights();
			}
		}
	}, [safeTriggerBlockId, setAttributes]);

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

	// Clean up when the component unmounts or before selection changes
	useEffect(() => {
		// This is the cleanup function that will run when the component unmounts
		return () => {
			// Clean up any highlight classes first
			cleanupAllHighlights();

			// Remove trigger classes from the current trigger block
			if (safeTriggerBlockId) {
				Debug.add(
					`Component unmounting, cleaning up trigger class for ${safeTriggerBlockId}`
				);
				try {
					updateBlockTriggerClass(safeTriggerBlockId, modalId, false);
				} catch (error) {
					Debug.add(
						`Error cleaning up trigger class: ${error.message}`,
						true
					);
				}
			}
		};
	}, [safeTriggerBlockId, modalId, updateBlockTriggerClass]);

	// Load and scan for triggers when blocks change or on initial load
	useEffect(() => {
		if (blocks?.length && modalId) {
			Debug.add(
				`Scanning ${blocks.length} blocks and ${templateParts?.length || 0} template parts for potential triggers`
			);

			// Find triggers in main content blocks and all available template parts
			const detectedTriggers = findTriggerElements(true, modalId);

			// Additionally process the inner blocks of any template parts known to the editor
			if (templateParts && templateParts.length > 0) {
				templateParts.forEach((templatePart) => {
					Debug.add(
						`Scanning local template part: ${templatePart.slug || templatePart.clientId}`
					);

					// Process the template part's inner blocks directly if they exist
					if (
						templatePart.innerBlocks &&
						templatePart.innerBlocks.length > 0
					) {
						// Process these blocks directly as a separate source
						const templatePartTriggers = [];
						processBlocksForTriggers(
							templatePart.innerBlocks,
							templatePartTriggers,
							true, // These are from template part
							templatePart.slug ||
								templatePart.area ||
								'template-part',
							modalId
						);

						// Add metadata to identify these as template part blocks and add to main list
						templatePartTriggers.forEach((trigger) => {
							trigger.fromTemplatePart = true;
							trigger.templatePartId = templatePart.clientId;
							trigger.templatePartSlug =
								templatePart.slug || templatePart.area;
							trigger.templatePartArea = templatePart.area;

							// Make sure we don't have duplicates (by clientId)
							if (
								!detectedTriggers.some(
									(t) => t.clientId === trigger.clientId
								)
							) {
								detectedTriggers.push(trigger);
							}
						});

						Debug.add(
							`Found ${templatePartTriggers.length} triggers in local template part ${templatePart.slug || templatePart.clientId}`
						);
					}
				});
			}

			// First look for a block that already has the modal-trigger class
			const triggerWithClass = detectedTriggers.find(
				(trigger) => trigger.isTrigger === true
			);

			if (triggerWithClass) {
				Debug.add(
					`Found block with modal-trigger-${modalId} class: ${triggerWithClass.clientId}`
				);

				// If we found a trigger by class but it's not the current one, update it
				if (triggerWithClass.clientId !== safeTriggerBlockId) {
					Debug.add(
						`Updating trigger block ID to ${triggerWithClass.clientId} based on class`
					);
					setAttributes({
						triggerBlockId: triggerWithClass.clientId,
						triggerBlockKey: '', // Reset this since we're using the class
					});

					// Update the current trigger block ID ref
					previousTriggerBlockId.current = triggerWithClass.clientId;

					// Make sure the class is still applied
					updateBlockTriggerClass(
						triggerWithClass.clientId,
						modalId,
						true
					);

					return; // Exit early since we've updated the attributes
				}
			}

			// Check if saved trigger is in our detected triggers
			const savedTriggerFound =
				safeTriggerBlockId &&
				detectedTriggers.some((t) => t.clientId === safeTriggerBlockId);

			if (savedTriggerFound) {
				Debug.add(
					`Saved trigger ID ${safeTriggerBlockId} found in detected triggers`
				);

				// Make sure the class is still applied
				updateBlockTriggerClass(safeTriggerBlockId, modalId, true);
			}

			// Only update if triggers have changed - but be careful not to create an infinite loop
			const currentTriggersJSON = JSON.stringify(
				triggers.map((t) => ({
					clientId: t.clientId,
					type: t.type,
					name: t.name,
				}))
			);
			const detectedTriggersJSON = JSON.stringify(
				detectedTriggers.map((t) => ({
					clientId: t.clientId,
					type: t.type,
					name: t.name,
				}))
			);

			if (currentTriggersJSON !== detectedTriggersJSON) {
				// We need to check if we should add our saved trigger
				if (safeTriggerBlockId && !savedTriggerFound) {
					Debug.add(
						`Saved trigger ID ${safeTriggerBlockId} NOT found in detected triggers, attempting to add it`
					);

					// Look up the block directly in the registry
					try {
						const { select: wpSelect } = wp.data;
						if (wpSelect) {
							const savedBlock =
								wpSelect('core/block-editor').getBlock(
									safeTriggerBlockId
								);

							if (savedBlock) {
								Debug.add(
									`Successfully found saved block: ${savedBlock.name}`
								);

								// Determine if it's a button or link type
								const name = savedBlock.name || '';
								const blockAttributes =
									savedBlock.attributes || {};
								const blockType = name.split('/')[1] || name;
								const isButton =
									name.includes('button') ||
									name.includes('Button');

								// Add it to the detected triggers before setting state
								detectedTriggers.push({
									clientId: safeTriggerBlockId,
									name,
									type: isButton ? 'button' : 'link',
									text:
										blockAttributes.text ||
										blockAttributes.content ||
										blockType ||
										'Saved Trigger',
									isTrigger: true, // Mark it as a trigger
								});

								Debug.add(
									`Added saved trigger to detected triggers list`
								);

								// Make sure the class is applied
								updateBlockTriggerClass(
									safeTriggerBlockId,
									modalId,
									true
								);
							} else {
								Debug.add(
									`Could not find saved block with ID: ${safeTriggerBlockId}`
								);
							}
						}
					} catch (err) {
						Debug.add(
							`Error looking up saved block: ${err.message}`
						);
					}
				}

				// Attempt to find by key first, then fallback to ID
				if (attributes.triggerBlockKey && !savedTriggerFound) {
					let foundByKey = false;

					// Try to find block by the persistent key
					blocks.forEach((block) => {
						const blockKey = generateBlockKey(block);
						if (blockKey === attributes.triggerBlockKey) {
							// We found a match by key, update the clientId
							Debug.add(
								`Found block by persistent key ${attributes.triggerBlockKey}`
							);
							setAttributes({ triggerBlockId: block.clientId });

							// Update the class for this block
							updateBlockTriggerClass(
								block.clientId,
								modalId,
								true
							);

							foundByKey = true;
						}
					});

					if (foundByKey) {
						// We've updated the triggerBlockId, don't need further processing
						return;
					}
				}

				// Now set the triggers with our potentially modified list
				setTriggers(detectedTriggers);
				Debug.add(
					`Updated triggers list with ${detectedTriggers.length} items`
				);
			}
		}
	}, [
		blocks,
		modalId,
		triggers,
		safeTriggerBlockId,
		attributes.triggerBlockKey,
		setAttributes,
		templateParts,
		updateBlockTriggerClass,
	]);

	// Handle highlighting when selection changes
	useEffect(() => {
		if (isSelected && safeTriggerBlockId) {
			// First make sure the trigger class is applied correctly
			updateBlockTriggerClass(safeTriggerBlockId, modalId, true);

			// When the modal is selected and has a trigger, highlight that trigger
			setTimeout(() => {
				// Clean up any existing highlights first to prevent duplicates
				cleanupAllHighlights();

				// Use a small timeout to ensure the DOM is ready
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
			}, 100);
		} else {
			// Clean up highlights when deselected
			cleanupAllHighlights();
			setIsHighlightActive(false);
		}

		// Clean up when unmounting
		return () => cleanupAllHighlights();
	}, [isSelected, safeTriggerBlockId, modalId, updateBlockTriggerClass]);

	// When triggerBlockId changes, update the highlight ONLY if the modal is selected
	useEffect(() => {
		// Only show highlight if the modal is selected
		if (isSelected && safeTriggerBlockId) {
			// First make sure the trigger class is applied correctly
			updateBlockTriggerClass(safeTriggerBlockId, modalId, true);

			setTimeout(() => {
				// Clean up any existing highlights first
				cleanupAllHighlights();

				// Use a small timeout to ensure the DOM is ready
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
			}, 100);
		}
	}, [safeTriggerBlockId, modalId, isSelected, updateBlockTriggerClass]); // Add updateBlockTriggerClass as a dependency

	// After the other useEffect hooks, add a new one to subscribe to block selection changes globally
	// Add a global selection change listener to ensure highlights are cleaned up
	useEffect(() => {
		// Don't bother if we don't have a trigger block
		if (!safeTriggerBlockId) {
			return;
		}

		// Subscribe to selection changes in the block editor
		const { subscribe } = wp.data;
		const unsubscribe = subscribe(() => {
			const blockEditor = wp.data.select('core/block-editor');
			if (!blockEditor) {
				return;
			}

			// First check if the trigger block still exists
			const triggerBlockExists = blockEditor.getBlock(safeTriggerBlockId);
			if (!triggerBlockExists) {
				Debug.add(
					`Trigger block ${safeTriggerBlockId} no longer exists - clearing reference`,
					true
				);
				setAttributes({ triggerBlockId: '' });
				previousTriggerBlockId.current = null;
				cleanupAllHighlights();
				setIsHighlightActive(false);
				return;
			}

			const selectedBlockId = blockEditor?.getSelectedBlockClientId();

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
					Debug.add(
						'Selection changed to another block, cleaning up highlights'
					);
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
			const blockExists =
				blockEditor && blockEditor.getBlock(safeTriggerBlockId);

			if (!blockExists) {
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
	 * Handle trigger selection change
	 *
	 * @param {string} selectedBlockId - Block ID that was selected
	 */
	const handleTriggerBlockChange = useCallback(
		(selectedBlockId) => {
			// Store the previous trigger for cleanup
			const prevTriggerId = previousTriggerBlockId.current;

			// Make sure we do a thorough cleanup first
			cleanupAllHighlights();
			setIsHighlightActive(false);

			// Always clean up the previous trigger if it exists and it's different from the newly selected one
			if (prevTriggerId && prevTriggerId !== selectedBlockId) {
				Debug.add(
					`Removing trigger class from previous block: ${prevTriggerId}`
				);

				// Verify if previous block still exists before trying to remove classes
				const blockEditor = wp.data.select('core/block-editor');
				const prevBlockExists =
					blockEditor && blockEditor.getBlock(prevTriggerId);

				if (prevBlockExists) {
					// Remove all modal-trigger classes from previous trigger
					try {
						updateBlockTriggerClass(prevTriggerId, modalId, false);
					} catch (error) {
						Debug.add(
							`Error removing trigger class: ${error.message}`,
							true
						);
					}
				} else {
					Debug.add(
						`Previous block ${prevTriggerId} no longer exists - skipping cleanup`,
						true
					);
				}
			}

			// If removing the trigger or selecting the same trigger
			if (!selectedBlockId || selectedBlockId === prevTriggerId) {
				// Clear the trigger settings
				setAttributes({
					triggerBlockId: '',
				});

				previousTriggerBlockId.current = null;
				return;
			}

			// Verify selected block exists before proceeding
			const blockEditor = wp.data.select('core/block-editor');
			const newBlockExists =
				blockEditor && blockEditor.getBlock(selectedBlockId);

			if (!newBlockExists) {
				Debug.add(
					`Selected block ${selectedBlockId} not found - cannot set as trigger`,
					true
				);
				return;
			}

			// Update the trigger in attributes
			setAttributes({
				triggerBlockId: selectedBlockId,
			});

			// Update the class on the new trigger block
			try {
				updateBlockTriggerClass(selectedBlockId, modalId, true);
			} catch (error) {
				Debug.add(`Error adding trigger class: ${error.message}`, true);
			}

			// Highlight the new trigger only if the modal is selected
			if (isSelected) {
				setTimeout(() => {
					try {
						highlightModalTrigger(null, modalId, selectedBlockId, {
							discreet: true,
						});
						setIsHighlightActive(true);
					} catch (error) {
						Debug.add(
							`Error highlighting trigger: ${error.message}`,
							true
						);
					}
				}, 100);
			}

			// Store for next time
			previousTriggerBlockId.current = selectedBlockId;
		},
		[modalId, setAttributes, isSelected, updateBlockTriggerClass]
	);

	/**
	 * Render the inspector controls
	 *
	 * @return {JSX.Element} Inspector controls
	 */
	const renderInspectorControls = () => (
		<InspectorControls>
			<PanelBody title={__('Modal Settings', 'modal')} initialOpen={true}>
				{/* Modal ID */}
				<TextControl
					label={__('Modal ID', 'modal')}
					value={modalId}
					onChange={(value) => setAttributes({ modalId: value })}
					help={__(
						'Unique identifier for this modal. Used to link triggers to this modal.',
						'modal'
					)}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{/* Position */}
				<SelectControl
					label={__('Modal Position', 'modal')}
					value={safePosition}
					options={[
						{ label: __('Center', 'modal'), value: 'center' },
						{ label: __('Top Left', 'modal'), value: 'top-left' },
						{ label: __('Top Right', 'modal'), value: 'top-right' },
						{
							label: __('Bottom Left', 'modal'),
							value: 'bottom-left',
						},
						{
							label: __('Bottom Right', 'modal'),
							value: 'bottom-right',
						},
					]}
					onChange={(value) => setAttributes({ position: value })}
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{/* Open on load */}
				<ToggleControl
					label={__('Open on Page Load', 'modal')}
					checked={openOnLoad}
					onChange={(value) => setAttributes({ openOnLoad: value })}
					help={__(
						'When enabled, the modal will automatically open when the page loads',
						'modal'
					)}
					__nextHasNoMarginBottom
				/>

				{/* Trigger block select */}
				<SelectControl
					label={__('Trigger Block', 'modal')}
					value={safeTriggerBlockId}
					options={availableTriggers}
					onChange={handleTriggerBlockChange}
					help={__('Select a block to trigger this modal', 'modal')}
				/>

				{/* Show highlight status */}
				{isHighlightActive && safeTriggerBlockId && isSelected && (
					<Notice status="info" isDismissible={false}>
						{__(
							'Trigger block is highlighted in the editor',
							'modal'
						)}
					</Notice>
				)}

				{/* Show message when not selected */}
				{safeTriggerBlockId && !isSelected && (
					<Notice status="warning" isDismissible={false}>
						{__(
							'Select this modal to highlight the trigger block',
							'modal'
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
										'modal'
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
								{__('Refresh Highlight', 'modal')}
							</Button>
						</div>
					</Tooltip>
				)}

				{/* Trigger label (only if no block selected) */}
				{!safeTriggerBlockId && (
					<TextControl
						label={__('Trigger Button Label', 'modal')}
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
				title={__('Manual Connection', 'modal')}
				initialOpen={false}
			>
				<p>
					{__(
						'To connect any HTML element to this modal, add this class:',
						'modal'
					)}
				</p>
				{modalId && (
					<>
						<code className="modal-connection-code">
							modal-trigger-{modalId}
						</code>
						<p className="modal-connection-example">
							{__('Example:', 'modal')}
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
							{__('Copy to Clipboard', 'modal')}
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
					<div className="modal-editor-header">
						<Icon icon="media-interactive" />
						<h2>{__('Modal Block', 'modal')}</h2>
						<Tooltip
							text={__(
								'Modal ID - Used to connect trigger elements',
								'modal'
							)}
						>
							<p className="modal-id">
								{__('ID:', 'modal')} {modalId}
							</p>
						</Tooltip>
					</div>

					<div className="modal-editor-content">
						{safeTriggerBlockId && (
							<div className="modal-trigger-notice">
								<p>
									{__('Connected to trigger block', 'modal')}
								</p>
								<Tooltip
									text={
										!isSelected
											? __(
													'Select the modal first to use this button',
													'modal'
												)
											: ''
									}
								>
									<div>
										<Button
											variant="secondary"
											className="find-trigger-button"
											onClick={handleRefreshHighlight}
											disabled={!isSelected}
										>
											<span>🔍</span>{' '}
											{__('Find Trigger Block', 'modal')}
										</Button>
									</div>
								</Tooltip>
							</div>
						)}

						<InnerBlocks
							template={[
								[
									'core/heading',
									{
										level: 3,
										content: __('Modal Title', 'modal'),
									},
								],
								[
									'core/paragraph',
									{
										content: __(
											'Add your modal content here…',
											'modal'
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
								{__('Position:', 'modal')} {safePosition}
							</span>
						</div>

						{openOnLoad && (
							<div className="modal-auto-open-indicator">
								<span>
									{__(
										'Opens automatically on page load',
										'modal'
									)}
								</span>
							</div>
						)}

						{safeTriggerBlockId ? (
							<div>
								<span>
									{__('Has trigger block', 'modal')}{' '}
									<Icon icon={linkIcon} size={14} />
								</span>
							</div>
						) : (
							<div>
								<span>
									{__('Trigger label:', 'modal')}{' '}
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
