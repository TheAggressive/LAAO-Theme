<?php
/**
 * Server render for the Post Featured Image block.
 *
 * Renders the featured image with the picture_id meta value as its caption.
 *
 * Exposed to this file by WordPress:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @package LAAO
 */

global $post;
?>
<figure <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<?php echo get_the_post_thumbnail( $post->ID ); ?>
	<?php
	if ( get_post_meta( get_the_ID(), 'picture_id', true ) ) {
		?>
		<figcaption class="wp-block-laao-post-featured-image-caption"><?php echo wp_kses_post( get_post_meta( get_the_ID(), 'picture_id', true ) ); ?></figcaption>
		<?php
	}
	?>
</figure>
