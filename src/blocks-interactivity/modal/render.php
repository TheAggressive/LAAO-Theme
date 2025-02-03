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

/**
 * Add interactivity attributes to modal triggers using the WordPress HTML API
 */

if ( ! function_exists( 'add_modal_trigger_interactivity' ) ) {

	function add_modal_trigger_interactivity() {
		// Get the current page HTML
		$content = ob_get_contents();

		// Quick check if we even need to process
		if ( strpos( $content, 'modal-trigger-' ) === false ) {
			return;
		}

		$html     = new WP_HTML_Tag_Processor( $content );
		$modified = false;

		// Find elements with modal trigger classes
		while ( $html->next_tag() ) {
			$class = $html->get_attribute( 'class' );
			if ( $class && strpos( $class, 'modal-trigger-' ) !== false && preg_match( '/modal-trigger-([a-zA-Z0-9-]+)/', $class, $matches ) ) {
				print_r( 'Found modal trigger: ' . $matches[1] . "\n" );

				// Add the interactive attributes
				$html->set_attribute( 'data-wp-interactive', 'laao/modal' );
				$html->set_attribute( 'data-wp-context', '{"modalId": "' . $matches[1] . '"}' );
				$html->set_attribute( 'data-wp-on--click', 'actions.toggle' );
				$html->set_attribute( 'data-modal-target', $matches[1] );
				$html->add_class( 'debug-modal-trigger' );
				$modified = true;
			}
		}

		if ( $modified ) {
			// Clear the buffer and output the modified HTML
			ob_clean();
			echo $html->get_updated_html();
		}
	}

	// Start output buffering at the beginning of the page
	add_action(
		'template_redirect',
		function () {
			ob_start();
		}
	);

	// Process the HTML just before it's sent to the browser
	add_action( 'shutdown', 'add_modal_trigger_interactivity', 0 );
}

// At the top of render.php, before any HTML output
if (empty($attributes['modalInstanceId']) || !isset($attributes['modalInstanceId'])) {
	$attributes['modalInstanceId'] = substr(md5(uniqid()), 0, 9);

	// Update the block attributes if we're in the editor
	if (is_admin()) {
		wp_add_inline_script(
			'wp-edit-blocks',
			sprintf(
				'wp.data.dispatch("core/block-editor").updateBlockAttributes("%s", { modalInstanceId: "%s" });',
				esc_js($block->parsed_block['id']),
				esc_js($attributes['modalInstanceId'])
			)
		);
	}
}

print_r( $attributes );
?>
<div id="<?php echo esc_attr( $block_id ); ?>" <?php echo get_block_wrapper_attributes(); ?>>
	<div class="modal-trigger-wrapper">
		<button
			type="button"
			class="modal-trigger"
			data-wp-on--click="actions.toggle"
			data-modal-target="<?php echo esc_attr( $attributes['modalInstanceId'] ); ?>"
			aria-controls="<?php echo esc_attr( $attributes['modalInstanceId'] ); ?>"
			aria-expanded="false"
		>
			<?php echo esc_html( $attributes['buttonText'] ); ?>
		</button>
	</div>

	<div
		id="<?php echo esc_attr( $attributes['triggerBlockClientId'] ); ?>"
		class="modal-container"
		data-wp-interactive="laao/modal"
		<?php
				echo wp_kses_data(
					wp_interactivity_data_wp_context(
						array(
							'modalId' => $attributes['triggerBlockClientId'],
						)
					)
				);
				?>
		data-wp-bind--aria-hidden="!state.isOpen"
		data-wp-class--is-open="state.isOpen"
		data-wp-on--keydown="actions.handleEscape"
		data-wp-bind--aria-modal="!state.isOpen"
		role="dialog"
		aria-labelledby="modal-title-<?php echo esc_attr( 'block-'. $attributes['modalInstanceId'] ); ?>"
		tabindex="-1"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="modal-title-<?php echo esc_attr( $attributes['modalInstanceId'] ); ?>">
					<?php echo esc_html( $attributes['modalTitle'] ); ?>
				</h2>
				<button
					type="button"
					class="modal-close"
					data-wp-on--click="actions.close"
					aria-label="Close modal"
				>×</button>
			</div>
			<div class="modal-body">
				<?php echo wp_kses_post( $clean_content ); ?>
			</div>
		</div>
	</div>
</div>
