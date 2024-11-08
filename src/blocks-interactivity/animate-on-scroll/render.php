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

// Build animation class that combines animation type and direction
$animation_classes = array( 'wp-block-laao-animate-on-scroll' );

// Add the base animation class
$animation_classes[] = esc_attr( $attributes['animation'] );

// Add direction for animations that support it
if ( in_array( $attributes['animation'], array( 'fade-direction', 'slide', 'flip', 'rotate' ) ) ) {
	$animation_classes[] = esc_attr( $attributes['direction'] );
}

// Join classes with spaces
$final_classes = implode( ' ', array_filter( $animation_classes ) );

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'                     => $final_classes,
		'data-wp-interactive'       => 'laao/animate-on-scroll',
		'data-wp-context'           => wp_json_encode( array( 'isVisible' => false ) ),
		'data-wp-init'              => 'callbacks.initObserver',
		'data-wp-class--is-visible' => 'context.isVisible',
		'data-stagger-children'     => $attributes['staggerChildren'] ? 'true' : 'false',
		'data-stagger-delay'        => esc_attr( $attributes['staggerDelay'] ),
		'data-animation-duration'   => esc_attr( $attributes['duration'] ),
		'data-root-margin'          => esc_attr( $attributes['rootMargin'] ),
		'data-threshold'            => esc_attr( $attributes['threshold'] ),
	)
);

printf(
	'<div %1$s>%2$s</div>',
	$wrapper_attributes,
	$content
);
