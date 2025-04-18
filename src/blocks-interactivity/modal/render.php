<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Make sure attributes array has all the necessary keys with defaults
$attributes = wp_parse_args(
	$attributes,
	array(
		'modalId'            => '',
		'position'           => 'center',
		'openOnLoad'         => false,
		'triggerBlockId'     => '',
		'triggerBlockKey'    => '',
		'triggerBlockAnchor' => '',
		'triggerLabel'       => __( 'Open Modal', 'modal' ),
	)
);

// Generate a unique ID for modal elements
$unique_id = ! empty( $attributes['modalId'] )
	? esc_attr( $attributes['modalId'] )
	: 'modal-' . wp_unique_id();

// Get modal position
$position = esc_attr( $attributes['position'] );

// Get open on load setting
$open_on_load = $attributes['openOnLoad'] ? true : false;

// Get trigger block ID if any
$trigger_block_id = esc_attr( $attributes['triggerBlockId'] );

// Get trigger block key for persistent identification
$trigger_block_key = esc_attr( $attributes['triggerBlockKey'] );

// Get trigger block anchor if any (more reliable across page loads)
$trigger_block_anchor = esc_attr( $attributes['triggerBlockAnchor'] );

// Get custom trigger label
$trigger_label = esc_html( $attributes['triggerLabel'] );

// Initialize the interactive state
wp_interactivity_state(
	'laao_modal_' . $unique_id,
	array(
		'isOpen'    => $open_on_load,
		'triggerId' => $trigger_block_id,
	)
);

// Modal position class
$position_class = 'modal-position-' . $position;

// Get inner blocks content
$inner_content = $content;
?>

<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="laao_modal_<?php echo esc_attr( $unique_id ); ?>"
	data-wp-watch="callbacks.initModal"
	data-modal-id="<?php echo esc_attr( $unique_id ); ?>"
>
	<?php if ( empty( $trigger_block_id ) ) : ?>
	<!-- Default trigger button if no external trigger block is set -->
	<button
		class="wp-block-laao-modal-trigger"
		data-wp-on--click="actions.toggleModal"
		data-wp-bind--aria-expanded="state.isOpen"
		aria-controls="<?php echo esc_attr( $unique_id ); ?>"
	>
		<?php echo esc_html( $trigger_label ); ?>
	</button>
	<?php endif; ?>

	<!-- Modal overlay -->
	<div
		class="wp-block-laao-modal-overlay"
		data-wp-on--click="actions.closeModal"
		data-wp-class--is-open="state.isOpen"
	></div>

	<!-- Modal container -->
	<div
		id="<?php echo esc_attr( $unique_id ); ?>"
		class="wp-block-laao-modal-container <?php echo esc_attr( $position_class ); ?>"
		data-wp-class--is-open="state.isOpen"
		role="dialog"
		aria-modal="true"
		aria-labelledby="<?php echo esc_attr( $unique_id ); ?>-title"
	>
		<div class="wp-block-laao-modal-content">
			<button
				class="wp-block-laao-modal-close"
				data-wp-on--click="actions.closeModal"
				aria-label="<?php esc_attr_e( 'Close modal', 'modal' ); ?>"
			>
				&times;
			</button>

			<div class="wp-block-laao-modal-body">
				<?php echo wp_kses_post( $inner_content ); // InnerBlocks content ?>
			</div>
		</div>
	</div>

	<!-- Script to bind external trigger to this modal -->
	<script>
		document.addEventListener('DOMContentLoaded', function() {
			const modalId = '<?php echo esc_js( $unique_id ); ?>';
			let triggerElement = null;

			// Function to check if an element is clickable
			const isClickableElement = (element) => {
				// Intrinsically clickable elements
				if (element.tagName === 'A' || element.tagName === 'BUTTON') {
					return true;
				}

				// Elements with clickable roles
				const clickableRoles = ['button', 'link', 'menuitem', 'tab'];
				const role = element.getAttribute('role');
				if (role && clickableRoles.includes(role)) {
					return true;
				}

				// Elements with click-related attributes
				return element.hasAttribute('onclick') ||
						element.hasAttribute('href') ||
						(element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1');
			};

			// Function to find the nearest clickable parent of an element
			const findClickableParent = (element) => {
				if (!element || element.tagName === 'BODY') {
					return null;
				}

				if (isClickableElement(element)) {
					return element;
				}

				return findClickableParent(element.parentElement);
			};

			// Function to find clickable elements within a container or use the container itself
			const findDeepTriggers = (selector) => {
				const elements = document.querySelectorAll(selector);
				const result = [];

				elements.forEach(element => {
					// If the element itself is clickable, use it directly
					if (isClickableElement(element)) {
						result.push(element);
					} else {
						// Otherwise, look for clickable elements inside it
						// Prioritize buttons and links
						const clickableChildren = element.querySelectorAll('a, button, [role="button"], [onclick], [href]');
						if (clickableChildren.length > 0) {
							clickableChildren.forEach(child => {
								if (isClickableElement(child)) {
									result.push(child);
								}
							});
						} else {
							// If no clickable children, try to find a clickable parent
							const clickableParent = findClickableParent(element);
							if (clickableParent) {
								result.push(clickableParent);
							} else {
								// Last resort: make the element itself clickable if needed
								// Add tabindex to make it focusable and give it button role for accessibility
								element.setAttribute('tabindex', '0');
								element.setAttribute('role', 'button');
								result.push(element);
							}
						}
					}
				});

				return result;
			};

			// FIRST PRIORITY: Find elements with class modal-trigger-{modalId}
			// This is the most reliable and recommended approach
			const triggerClass = '.modal-trigger-<?php echo esc_js( $unique_id ); ?>';
			const classTriggers = findDeepTriggers(triggerClass);
			if (classTriggers.length > 0) {
				classTriggers.forEach(trigger => {
					trigger.classList.add('wp-block-laao-modal-trigger');
					trigger.setAttribute('aria-controls', modalId);
					// Only prevent default for elements that might have default actions
					trigger.addEventListener('click', function(e) {
						if (trigger.tagName === 'A' || trigger.tagName === 'BUTTON' ||
							trigger.getAttribute('role') === 'button' || trigger.hasAttribute('href')) {
							e.preventDefault();
						}
						window.dispatchEvent(
							new CustomEvent('laao_modal_trigger', {
								detail: { modalId: modalId }
							})
						);
					});
				});

				// We found at least one trigger, so we're done
				return;
			}

			// SECOND PRIORITY: Try to find the trigger by anchor
			<?php if ( ! empty( $trigger_block_anchor ) ) : ?>
			// First try direct anchor match
			triggerElement = document.getElementById('<?php echo esc_js( $trigger_block_anchor ); ?>');

			// If the element exists, check if it's clickable or find a clickable element within it
			if (triggerElement) {
				let targetElements = [];

				if (isClickableElement(triggerElement)) {
					targetElements.push(triggerElement);
				} else {
					// Look for clickable elements inside
					const clickableChildren = triggerElement.querySelectorAll('a, button, [role="button"], [onclick], [href]');
					if (clickableChildren.length > 0) {
						clickableChildren.forEach(child => {
							if (isClickableElement(child)) {
								targetElements.push(child);
							}
						});
					} else {
						// If no clickable children, make the element itself clickable
						triggerElement.setAttribute('tabindex', '0');
						triggerElement.setAttribute('role', 'button');
						targetElements.push(triggerElement);
					}
				}

				// Setup all found clickable elements
				targetElements.forEach(el => {
					el.classList.add('wp-block-laao-modal-trigger');
					el.setAttribute('aria-controls', modalId);
					// Only prevent default for elements that might have default actions
					el.addEventListener('click', function(e) {
						if (el.tagName === 'A' || el.tagName === 'BUTTON' ||
							el.getAttribute('role') === 'button' || el.hasAttribute('href')) {
							e.preventDefault();
						}
						window.dispatchEvent(
							new CustomEvent('laao_modal_trigger', {
								detail: { modalId: modalId }
							})
						);
					});
				});

				// We've set up the triggers based on anchor, so we're done
				return;
			}
			<?php endif; ?>

			// THIRD PRIORITY: Backward compatibility - Support data attributes if they exist
			const dataAttrTriggers = findDeepTriggers('[data-trigger-modal="<?php echo esc_js( $unique_id ); ?>"]');
			if (dataAttrTriggers.length > 0) {
				dataAttrTriggers.forEach(trigger => {
					trigger.classList.add('wp-block-laao-modal-trigger');
					trigger.setAttribute('aria-controls', modalId);
					// Only prevent default for elements that might have default actions
					trigger.addEventListener('click', function(e) {
						if (trigger.tagName === 'A' || trigger.tagName === 'BUTTON' ||
							trigger.getAttribute('role') === 'button' || trigger.hasAttribute('href')) {
							e.preventDefault();
						}
						window.dispatchEvent(
							new CustomEvent('laao_modal_trigger', {
								detail: { modalId: modalId }
							})
						);
					});
				});
				// We found at least one trigger with the data attribute, so we're done
				return;
			}

			// LAST RESORT: Try to find by block ID (least reliable)
			<?php if ( ! empty( $trigger_block_id ) ) : ?>
			const blockElement = document.querySelector('[data-block-id="<?php echo esc_js( $trigger_block_id ); ?>"]');
			if (blockElement) {
				let targetElements = [];

				if (isClickableElement(blockElement)) {
					targetElements.push(blockElement);
				} else {
					// Look for clickable elements inside
					const clickableChildren = blockElement.querySelectorAll('a, button, [role="button"], [onclick], [href]');
					if (clickableChildren.length > 0) {
						clickableChildren.forEach(child => {
							if (isClickableElement(child)) {
								targetElements.push(child);
							}
						});
					} else {
						// If no clickable children, make the element itself clickable
						blockElement.setAttribute('tabindex', '0');
						blockElement.setAttribute('role', 'button');
						targetElements.push(blockElement);
					}
				}

				// Setup all found clickable elements
				targetElements.forEach(el => {
					el.classList.add('wp-block-laao-modal-trigger');
					el.setAttribute('aria-controls', modalId);
					// Only prevent default for elements that might have default actions
					el.addEventListener('click', function(e) {
						if (el.tagName === 'A' || el.tagName === 'BUTTON' ||
							el.getAttribute('role') === 'button' || el.hasAttribute('href')) {
							e.preventDefault();
						}
						window.dispatchEvent(
							new CustomEvent('laao_modal_trigger', {
								detail: { modalId: modalId }
							})
						);
					});
				});
			}
			<?php endif; ?>
		});
	</script>
</div>
