<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
global $post;
?>
<figure <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<?php echo get_the_post_thumbnail( $post->id ); ?>
	<?php
	if ( get_post_meta( get_the_ID(), 'picture_id', true ) ) {
		?>
		<figcaption class="wp-block-laao-post-featured-image-caption"><?php echo wp_kses_post( get_post_meta( get_the_ID(), 'picture_id', true ) ); ?></figcaption>
		<?php
	}
	?>
</figure>
