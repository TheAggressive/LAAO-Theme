<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}   // Exit if accessed directly

$content = '';

if ( get_post_meta( get_the_ID(), 'by_options', true ) && get_post_meta( get_the_ID(), 'author', true ) ) {
	$content .= '<li>' . get_post_meta( get_the_ID(), 'by_options', true ) . ' ' . get_post_meta( get_the_ID(), 'author', true ) . '</li>';
}

if ( get_post_meta( get_the_ID(), 'photo_credits_types', true ) && get_post_meta( get_the_ID(), 'photo_credits_types', true ) !== 'Please Select' && get_post_meta( get_the_ID(), 'photo_credit_belongs_to', true ) ) {
	$content .= '<li>' . get_post_meta( get_the_ID(), 'photo_credits_types', true ) . ' ' . get_post_meta( get_the_ID(), 'photo_credit_belongs_to', true ) . '</li>';
}

if ( get_post_meta( get_the_ID(), 'location', true ) ) {
	$content .= '<li>Location ' . get_post_meta( get_the_ID(), 'location', true ) . '</li>';
}

if ( get_post_meta( get_the_ID(), 'hair_by', true ) ) {
	$content .= '<li>Hair By ' . get_post_meta( get_the_ID(), 'hair_by', true ) . '</li>';
}

if ( get_post_meta( get_the_ID(), 'make_up_by', true ) ) {
	$content .= '<li>Makeup By ' . get_post_meta( get_the_ID(), 'make_up_by', true ) . '</li>';
}

if ( get_post_meta( get_the_ID(), 'grooming_by', true ) ) {
	$content .= '<li>Grooming By ' . get_post_meta( get_the_ID(), 'grooming_by', true ) . '</li>';
}


?>
<ul <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<?php echo wp_kses_post( $content ); ?>
</ul>
