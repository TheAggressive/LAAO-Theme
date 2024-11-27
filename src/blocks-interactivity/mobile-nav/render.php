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

<button <?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="laao/mobile-nav" data-wp-on--click="actions.toggleMenu" data-wp-on-async-window--resize="callbacks.handleResize">

	<?php
	if ( 'menuIcon' === $attributes['icon'] ) {
		?>

		<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 12H21M3 6H21M3 18H21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>

	<?php } else { ?>

		<svg width="36" height="36" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
				<path d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>

	<?php } ?>

</button>
