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
$unique_id = wp_unique_id( 'p-' );

?>

<div
	<?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="laao/mobile-nav"
	<?php echo wp_kses_post( wp_interactivity_data_wp_context( array( 'isActive' => false ) ) ); ?>
>
	<button data-wp-on--click="actions.toggleMenu">
		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 12H21M3 6H21M3 18H21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	</button>
</div>
