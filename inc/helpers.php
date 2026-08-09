<?php
/**
 * Template helpers.
 *
 * Plain functions for use inside block render callbacks, which run in a closure
 * without a `use` context and so cannot conveniently reach namespaced classes.
 *
 * @package LAAO
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'laao_trusted_html' ) ) {
	/**
	 * Marks a string as already-escaped HTML.
	 *
	 * This performs NO escaping. It returns its argument unchanged. Its only
	 * purpose is to state, at the point of output, that the caller has already
	 * escaped every interpolated value — and to give PHPCS's EscapeOutput sniff
	 * something it recognises instead of scattering ignore comments.
	 *
	 * That makes it a promise, not a control. Only pass strings assembled from
	 * literals and values that have been through esc_attr(), esc_html() or
	 * equivalent. Passing raw input here is indistinguishable, to both PHPCS and
	 * the reader, from code that is safe.
	 *
	 * Prefer wp_kses_post() for anything whose provenance is uncertain, and note
	 * that it strips attributes it does not allow — including srcset, sizes,
	 * fetchpriority and decoding on images.
	 *
	 * @param string $html Pre-escaped HTML.
	 * @return string The same string, unchanged.
	 */
	function laao_trusted_html( string $html ): string {
		return $html;
	}
}

if ( ! function_exists( 'laao_modal_opens_itself' ) ) {
	/**
	 * Whether a modal already has a way to open, so needs no default button.
	 *
	 * The modal block renders an "Open Modal" button only as a fallback: it
	 * exists so a modal is reachable at all. Every other way of opening one
	 * makes it redundant, and a stray button offering to open a dialog that
	 * opens by itself is worse than no button.
	 *
	 * openOnLoad was missing from this list, which is how a modal set to open
	 * on page load still rendered one. It lives here rather than inline in
	 * render.php so the rule can be tested without rendering a block.
	 *
	 * openOnLoadOnce is deliberately absent: the editor only offers it while
	 * openOnLoad is on, so it modifies that trigger rather than being one.
	 *
	 * @param string $trigger_block_id Client ID of a block designated as the trigger.
	 * @param bool   $open_on_load     Opens automatically on page load.
	 * @param bool   $exit_intent      Opens on exit intent.
	 * @param bool   $scroll_depth     Opens at a scroll depth.
	 * @return bool True when something already opens the modal.
	 */
	function laao_modal_opens_itself(
		string $trigger_block_id,
		bool $open_on_load,
		bool $exit_intent,
		bool $scroll_depth
	): bool {
		return '' !== trim( $trigger_block_id )
			|| $open_on_load
			|| $exit_intent
			|| $scroll_depth;
	}
}
