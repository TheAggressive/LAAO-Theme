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

// Parse attributes with defaults
$attributes = wp_parse_args(
	$attributes,
	array(
		'modalId'        => '',
		'position'       => 'center',
		'openOnLoad'     => false,
		'triggerBlockId' => '',
		'triggerLabel'   => __( 'Open Modal', 'laao' ),
	)
);

// Generate a unique ID for modal elements if not provided
$unique_id = ! empty( $attributes['modalId'] )
	? esc_attr( $attributes['modalId'] )
	: 'modal-' . wp_unique_id();

// Get position and other settings
$position         = esc_attr( $attributes['position'] );
$position_class   = 'modal-position-' . $position;
$open_on_load     = $attributes['openOnLoad'] ? true : false;
$trigger_block_id = ! empty( $attributes['triggerBlockId'] ) ? esc_attr( $attributes['triggerBlockId'] ) : '';
$trigger_label    = esc_html( $attributes['triggerLabel'] );

// Initialize the interactive state
wp_interactivity_state(
	'laao/modal',
	array(
		'modals' => array(
			$unique_id => array(
				'isActive'   => false,
				'id'         => $unique_id,
				'openOnLoad' => $open_on_load,
			),
		),
	)
);
?>

<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="laao/modal"
	data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
	data-wp-init="actions.init"
>
	<?php if ( empty( $trigger_block_id ) ) : ?>
	<!-- Default trigger button -->
	<button
		class="wp-block-laao-modal-trigger"
		data-wp-on--click="actions.openModal"
		data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
		data-wp-bind--aria-expanded="state.modals.<?php echo esc_attr( $unique_id ); ?>.isActive"
		aria-controls="<?php echo esc_attr( $unique_id ); ?>"
	>
		<?php echo esc_html( $trigger_label ); ?>
	</button>
	<?php endif; ?>

	<!-- Modal overlay -->
	<div
		class="wp-block-laao-modal-overlay"
		data-wp-on--click="actions.closeModal"
		data-wp-class--is-active="state.modals.<?php echo esc_attr( $unique_id ); ?>.isActive"
		aria-hidden="true"
	></div>

	<!-- Modal container -->
	<div
		id="<?php echo esc_attr( $unique_id ); ?>"
		class="wp-block-laao-modal-container <?php echo esc_attr( $position_class ); ?>"
		data-wp-class--is-active="state.modals.<?php echo esc_attr( $unique_id ); ?>.isActive"
		data-wp-on--keydown="callbacks.handleKeydown"
		data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
		role="dialog"
		aria-modal="true"
		aria-labelledby="<?php echo esc_attr( $unique_id ); ?>-title"
	>
		<!-- Modal content -->
		<div class="wp-block-laao-<?php echo esc_attr( $unique_id ); ?>-content">
			<!-- Close button -->
			<button
				class="wp-block-laao-modal-close"
				data-wp-on--click="actions.closeModal"
				data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
				aria-label="<?php esc_attr_e( 'Close modal', 'laao' ); ?>"
			>
				&times;
			</button>

			<!-- Modal body content -->
			<div class="wp-block-laao-modal-body">
				<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>
		</div>
	</div>
</div>
