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

// Generates a unique id for aria-controls.
$unique_id = wp_unique_id( 'modal-' );
?>

<div <?php echo get_block_wrapper_attributes( array( 'data-wp-interactive' => 'laao/modal' ) ); ?>>
	<div
		class="modal-container"
		data-wp-class--isOpen="callbacks.isModalOpen"
		data-wp-on--keydown="actions.handleEscape"
		id="<?php echo esc_attr( $unique_id ); ?>"
	>
		<div class="modal-content" aria-modal="true" role="dialog">
			<div class="modal-header">
				<h3><?php echo esc_html( $attributes['modalTitle'] ); ?></h3>
				<button
					type="button"
					class="modal-close"
					data-wp-on--click="actions.close"
				>×</button>
			</div>
			<div class="modal-body">
				<?php echo $content; ?>
			</div>
		</div>
	</div>
</div>
