<?php
/**
 * Server render for the Logo block.
 *
 * Outputs the site logo as a link to the home page.
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

?>

<a <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?> href="<?php echo esc_url( home_url() ); ?>" >
	<img src="<?php echo esc_url( get_template_directory_uri() ); ?>/dist/assets/svg/laao-logo.svg" alt="LAAO Logo" />
</a>
