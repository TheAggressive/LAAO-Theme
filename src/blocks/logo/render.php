<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
?>

<a <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?> href="#" >
<img src="<?php echo get_template_directory_uri(); ?>/dist/assets/svg/laao-logo.svg" alt="LAAO Logo" />
</a>
