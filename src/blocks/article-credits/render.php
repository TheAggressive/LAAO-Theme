<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
?>
<p <?php echo get_block_wrapper_attributes(); ?>>
	<?php echo esc_html( get_post_meta( get_the_ID(), 'by_options', true ) ); ?>
	<?php echo esc_html( get_post_meta( get_the_ID(), 'author', true ) ); ?>
	<?php echo esc_html( get_post_meta( get_the_ID(), 'photo_credits_types', true ) ); ?>
</p>
