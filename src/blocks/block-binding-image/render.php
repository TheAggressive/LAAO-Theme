<?php

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
if ( ! function_exists( 'laao_render_meta_image_block' ) ) {
	function laao_render_meta_image_block( $attributes ) {
		$meta_key = $attributes['metaKey'] ?? '';
		$size     = $attributes['sizeSlug'] ?? 'medium';

		if ( ! $meta_key ) {
			return ''; // No meta key, nothing to render
		}

		$post_id = get_the_ID();

		if ( ! $post_id ) {
			return ''; // No post context, nothing to render
		}

		$image_id = get_post_meta( $post_id, $meta_key, true );

		if ( empty( $image_id ) || ! wp_attachment_is_image( $image_id ) ) {
			return ''; // Meta not set or invalid
		}

		// Return the actual image markup
		return wp_get_attachment_image( $image_id, $size );
	}
}

echo wp_kses_post( laao_render_meta_image_block( $attributes ) );
