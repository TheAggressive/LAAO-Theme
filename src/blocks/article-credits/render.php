<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}   // Exit if accessed directly

// Load all meta for this post in a single DB query.
$post_id = get_the_ID();
$meta    = get_post_meta( $post_id );
$get     = fn( $key ) => isset( $meta[ $key ][0] ) ? $meta[ $key ][0] : '';

$content = '';

if ( $get( 'by_options' ) && $get( 'author' ) ) {
	$content .= '<li>' . $get( 'by_options' ) . ' ' . $get( 'author' ) . '</li>';
}

if ( $get( 'photo_credits_types' ) && $get( 'photo_credits_types' ) !== 'Please Select' && $get( 'photo_credit_belongs_to' ) ) {
	$content .= '<li>' . $get( 'photo_credits_types' ) . ' ' . $get( 'photo_credit_belongs_to' ) . '</li>';
}

if ( $get( 'location' ) ) {
	$content .= '<li>Location ' . $get( 'location' ) . '</li>';
}

if ( $get( 'hair_by' ) ) {
	$content .= '<li>Hair By ' . $get( 'hair_by' ) . '</li>';
}

if ( $get( 'make_up_by' ) ) {
	$content .= '<li>Makeup By ' . $get( 'make_up_by' ) . '</li>';
}

if ( $get( 'grooming_by' ) ) {
	$content .= '<li>Grooming By ' . $get( 'grooming_by' ) . '</li>';
}

?>
<ul <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<?php echo wp_kses_post( $content ); ?>
</ul>
