<?php
/**
 * Server render for the Block Binding Image block.
 *
 * Renders an attachment stored in a post meta key, letting an editor bind an
 * image field to a block without a custom field UI.
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

if ( ! function_exists( 'laao_render_meta_image_block' ) ) {
	/**
	 * Renders the image referenced by the bound meta key.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string Image markup, or an empty string when unbound.
	 */
	function laao_render_meta_image_block( $attributes ) {
		$meta_key = $attributes['metaKey'] ?? '';
		$size     = $attributes['sizeSlug'] ?? 'medium';

		if ( ! $meta_key ) {
			return ''; // No meta key, nothing to render.
		}

		$post_id = get_the_ID();

		if ( ! $post_id ) {
			return ''; // No post context, nothing to render.
		}

		$image_id = get_post_meta( $post_id, $meta_key, true );

		if ( empty( $image_id ) || ! wp_attachment_is_image( $image_id ) ) {
			return ''; // Meta not set or invalid.
		}

		// Return the actual image markup.
		return wp_get_attachment_image( $image_id, $size );
	}
}

echo wp_kses_post( laao_render_meta_image_block( $attributes ) );
