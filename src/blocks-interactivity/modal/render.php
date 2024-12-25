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

// Adds the global state.
wp_interactivity_state(
	'laao',
	array(
		'isDark'    => false,
		'darkText'  => esc_html__( 'Switch to Light', 'modal' ),
		'lightText' => esc_html__( 'Switch to Dark', 'modal' ),
		'themeText' => esc_html__( 'Switch to Dark', 'modal' ),
	)
);

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'wp-block-laao-modal-wrapper',
	)
);
?>

<div
	<?php echo $wrapper_attributes; ?>
	data-wp-interactive="laao"
	<?php
	echo wp_interactivity_data_wp_context(
		array(
			'isOpen'          => false,
			'triggerId'       => $unique_id,
		)
	);
	?>
	data-wp-init="actions.initializeModal"
>
	<!-- Trigger -->
	<div
		class="modal-trigger"
		data-wp-on--click="actions.toggleOpen"
	>
		<?php echo $content; ?>
	</div>

	<!-- Modal -->
	<div
		id="<?php echo esc_attr( $unique_id ); ?>"
		class="modal-container"
		data-wp-class--open="context.isOpen"
		data-wp-bind--hidden="!context.isOpen"
	>
		<div class="modal-overlay" data-wp-on--click="actions.toggleOpen"></div>
		<div class="modal-content">
			<button
				class="modal-close"
				data-wp-on--click="actions.toggleOpen"
				aria-label="<?php esc_attr_e( 'Close modal', 'modal' ); ?>"
			>×</button>
			<div class="modal-body">
				<?php echo $content; ?>
			</div>
		</div>
	</div>
</div>
