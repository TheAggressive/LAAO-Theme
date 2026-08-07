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
