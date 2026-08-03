<?php
/**
 * Server render for the Query Loop Ad Inserter block.
 *
 * Emits an ad slot at a chosen position inside a Query Loop, either after a
 * fixed number of posts or at the midpoint of the current page.
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

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.

if ( ! function_exists( 'laao_get_current_post_index' ) ) {
	/**
	 * Index of the post currently being rendered by the Query Loop.
	 *
	 * @return int Zero-based index within the current page of results.
	 */
	function laao_get_current_post_index() {
		global $wp_query;
		$current_post_index = $wp_query->current_post;
		return $current_post_index;
	}
}

if ( ! function_exists( 'laao_get_posts_per_page_count' ) ) {
	/**
	 * Number of posts the ad slot positions itself against.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return float Explicit placeAfter value, or the current page's post count.
	 */
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
	/**
	 * Index after which the ad slot is emitted.
	 *
	 * Defaults to the midpoint of the current page when placeAfter is unset.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return float Zero-based index to insert after.
	 */
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
