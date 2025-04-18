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
	'laao/modal',
	array(
		'modals' => array(
			$unique_id => array(
				'isActive'   => false,
				'triggerId'  => $trigger_block_id,
				'id'         => $unique_id,
				'openOnLoad' => $open_on_load,
			),
		),
	)
);

// Modal position class
$position_class = 'modal-position-' . $position;

// Get inner blocks content
$inner_content = $content;
?>

<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="laao/modal"
	data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
	data-wp-init="actions.init"
	<?php echo $open_on_load ? 'data-open-on-load="true"' : ''; ?>
>
	<?php if ( empty( $trigger_block_id ) ) : ?>
	<!-- Default trigger button if no external trigger block is set -->
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
		data-wp-on--keydown="callbacks.handleKeydown"
		data-wp-class--is-active="state.modals.<?php echo esc_attr( $unique_id ); ?>.isActive"
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
		<div class="wp-block-laao-<?php echo esc_attr( $unique_id ); ?>-content">
			<button
				class="wp-block-laao-modal-close"
				data-wp-on--click="actions.closeModal"
				data-wp-context='{ "id": "<?php echo esc_attr( $unique_id ); ?>" }'
				aria-label="<?php esc_attr_e( 'Close modal', 'laao' ); ?>"
				tabindex="-1"
			>
				&times;
			</button>

			<div class="wp-block-laao-modal-body">
				<?php
				// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
				echo $inner_content;
				// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
				?>
			</div>
		</div>
	</div>
</div>
