<?php
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}   // Exit if accessed directly

if ( ! function_exists( 'laao_get_current_post_index' ) ) {
	function laao_get_current_post_index() {
		global $wp_query;
		$current_post_index = $wp_query->current_post;
		return $current_post_index;
	}
}

if ( ! function_exists( 'laao_get_posts_per_page_count' ) ) {
	function laao_get_posts_per_page_count( $attributes ) {
		if ( isset( $attributes['placeAfter'] ) ) {
			$post_count = (float) $attributes['placeAfter'];
		} else {
			global $wp_query;
			$post_count = (float) $wp_query->post_count;
		}

		return $post_count;
	}
}

if ( ! function_exists( 'laao_get_post_count_target' ) ) {
	function laao_get_post_count_target( $attributes ) {
		if ( isset( $attributes['placeAfter'] ) ) {
			$post_count_target = $attributes['placeAfter'] - 1;
		} else {
			global $wp_query;
			$post_count        = $wp_query->post_count;
			$post_count_target = floor( ( $post_count - 1 ) / 2 );
		}

		return $post_count_target;
	}
}

if ( laao_get_current_post_index() === laao_get_post_count_target( $attributes ) ) {
	echo wp_kses_post( $content );
}
