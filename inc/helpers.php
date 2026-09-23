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

if ( ! function_exists( 'laao_unwrap_modal_saved_content' ) ) {
	/**
	 * Remove the legacy modal save wrapper from rendered InnerBlocks content.
	 *
	 * Earlier versions saved InnerBlocks inside a second .wp-block-laao-modal
	 * element. The dynamic render callback already supplies the actual wrapper,
	 * so retaining the saved one duplicates block-support backgrounds, borders
	 * and padding inside the dialog.
	 *
	 * @param string $content Rendered modal InnerBlocks content.
	 * @return string Inner content without the legacy wrapper.
	 */
	function laao_unwrap_modal_saved_content( string $content ): string {
		$trimmed = trim( $content );
		if (
			! preg_match(
				'/\A<div\b[^>]*\bclass=(["\'])([^"\']*)\1[^>]*>/i',
				$trimmed,
				$matches
			)
			|| ! str_ends_with( $trimmed, '</div>' )
		) {
			return $content;
		}

		$classes = preg_split( '/\s+/', $matches[2], -1, PREG_SPLIT_NO_EMPTY );
		if ( ! is_array( $classes ) || ! in_array( 'wp-block-laao-modal', $classes, true ) ) {
			return $content;
		}

		return substr( $trimmed, strlen( $matches[0] ), -strlen( '</div>' ) );
	}
}

if ( ! function_exists( 'laao_get_icon' ) ) {
	/**
	 * Get trusted theme SVG icon markup.
	 *
	 * Thin wrapper around Icons::get() so block render callbacks can reach
	 * the registry without a `use` context, and PHPCS can treat the return
	 * value as auto-escaped (class methods cannot be registered in
	 * customAutoEscapedFunctions).
	 *
	 * @param string               $icon  Icon name.
	 * @param array<string, mixed> $attrs Optional SVG attributes.
	 * @return string SVG markup or empty string if icon not found.
	 */
	function laao_get_icon( string $icon, array $attrs = array() ): string {
		return \LAAO\Core\Icons::get( $icon, $attrs );
	}
}

if ( ! function_exists( 'laao_render_icon' ) ) {
	/**
	 * Echo a trusted theme SVG icon.
	 *
	 * @param string               $icon  Icon name.
	 * @param array<string, mixed> $attrs Optional SVG attributes.
	 * @return void
	 */
	function laao_render_icon( string $icon, array $attrs = array() ): void {
		echo laao_get_icon( $icon, $attrs );
	}
}

if ( ! function_exists( 'laao_can_view_block_debug' ) ) {
	/**
	 * Whether front-end block debug tooling may render for this request.
	 *
	 * Debug Mode on the animate-on-scroll block is a saved block attribute,
	 * so without this gate a page saved with it enabled would ship the debug
	 * overlays (and download the debug script chunk) to every visitor.
	 * Requires an editing capability rather than a mere login so logged-in
	 * customers never see it either.
	 *
	 * @return bool True when debug tooling may render for this request.
	 */
	function laao_can_view_block_debug(): bool {
		/**
		 * Filters who may see front-end block debug tooling.
		 *
		 * @param bool $can_view Defaults to current_user_can( 'edit_posts' ).
		 */
		return (bool) apply_filters(
			'laao_can_view_block_debug',
			current_user_can( 'edit_posts' )
		);
	}
}

if ( ! function_exists( 'laao_block_debug_strings' ) ) {
	/**
	 * Localized strings shared by front-end block debug tooling.
	 *
	 * Mirrors `src/blocks-interactivity/debug-shared/i18n.ts` DEFAULT_STRINGS —
	 * keep keys in sync. The animate-on-scroll view module reads them from the
	 * `#aa-dbg-i18n` JSON blob printed by laao_enqueue_block_debug_assets().
	 *
	 * @return array<string, string> Debug strings keyed by stable slug.
	 */
	function laao_block_debug_strings(): array {
		return array(
			'titleParallax'      => __( 'Parallax Debug', 'laao' ),
			'titleAos'           => __( 'Animate On Scroll Debug', 'laao' ),
			'panelCollapse'      => __( 'Collapse debug panel', 'laao' ),
			'panelExpand'        => __( 'Expand debug panel', 'laao' ),
			'sectionLive'        => __( 'Live state', 'laao' ),
			'sectionDetails'     => __( 'Details', 'laao' ),
			'legend'             => __( 'Legend', 'laao' ),
			'rowState'           => __( 'State', 'laao' ),
			'rowVisibility'      => __( 'Visibility', 'laao' ),
			'rowProgress'        => __( 'Progress', 'laao' ),
			'rowDirection'       => __( 'Scroll direction', 'laao' ),
			'rowThreshold'       => __( 'Threshold', 'laao' ),
			'rowFramerate'       => __( 'Frame rate', 'laao' ),
			'rowSize'            => __( 'Element size', 'laao' ),
			'rowBoundary'        => __( 'Boundary', 'laao' ),
			'rowObserver'        => __( 'Observer', 'laao' ),
			'phaseWaiting'       => __( 'Waiting', 'laao' ),
			'phaseApproaching'   => __( 'Approaching', 'laao' ),
			'phaseActive'        => __( 'Active', 'laao' ),
			'engineLabel'        => __( 'Engine', 'laao' ),
			'engineActive'       => __( 'Active', 'laao' ),
			'engineIdle'         => __( 'Idle', 'laao' ),
			'animationLabel'     => __( 'Animation', 'laao' ),
			'animationShown'     => __( 'Shown', 'laao' ),
			'animationHidden'    => __( 'Hidden', 'laao' ),
			'reverseLabel'       => __( 'Reverse on scroll back', 'laao' ),
			'yes'                => __( 'Yes', 'laao' ),
			'no'                 => __( 'No', 'laao' ),
			'directionDown'      => __( '↓ Down', 'laao' ),
			'directionUp'        => __( '↑ Up', 'laao' ),
			'measuring'          => __( '— measuring…', 'laao' ),
			'thresholdEntry'     => __( '{pct}% entry', 'laao' ),
			'thresholdEntryExit' => __( '{entry}% entry · {exit}% exit', 'laao' ),
			'boundaryConfigured' => __( 'Detection boundary', 'laao' ),
			'boundaryEffective'  => __( 'Observer boundary (incl. engine buffer)', 'laao' ),
			'boundaryExtends'    => __( '· extends beyond viewport', 'laao' ),
			'lineEntryBottom'    => __( 'Entry (bottom) {pct}%', 'laao' ),
			'lineEntryTop'       => __( 'Entry (top) {pct}%', 'laao' ),
			'lineExit'           => __( 'Exit ≤ {pct}%', 'laao' ),
			'legendBoundary'     => __( 'Detection boundary — area the observer watches (viewport ± your margins)', 'laao' ),
			'legendEffective'    => __( 'Observer boundary — detection boundary plus the engine’s pre-activation buffer', 'laao' ),
			'legendElement'      => __( 'This block’s element — outlined even while its content is hidden', 'laao' ),
			'legendEntry'        => __( 'Entry line — triggers at {pct}% visible when scrolling down', 'laao' ),
			'legendEntryTop'     => __( 'Entry line for scrolling up (same {pct}%, measured from the bottom)', 'laao' ),
			'legendExit'         => __( 'Exit line — reverses once visibility falls below {pct}%', 'laao' ),
			'legendZone'         => __( 'Entry zone — tinted band the boundary edge must reach to trigger', 'laao' ),
			'warnUnreachable'    => __( 'Entry threshold {pct}% is unreachable: the element ({elem}px) is taller than the detection area ({root}px). Max visibility ≈ {max}%.', 'laao' ),
		);
	}
}

if ( ! function_exists( 'laao_enqueue_block_debug_assets' ) ) {
	/**
	 * Enqueue the shared debug overlay styles and i18n blob for a front-end block.
	 *
	 * Called from render callbacks only when laao_can_view_block_debug() is
	 * true, so anonymous visitors never download the debug chunk or see the
	 * overlay markup. The style handle doubles as a de-duplication key: several
	 * blocks on one page enqueue the same assets once.
	 *
	 * @return void
	 */
	function laao_enqueue_block_debug_assets(): void {
		if ( file_exists( get_stylesheet_directory() . '/dist/styles/debug-overlays.css' ) ) {
			wp_enqueue_style(
				'laao-debug-overlays',
				get_template_directory_uri() . '/dist/styles/debug-overlays.css',
				array(),
				wp_get_theme()->get( 'Version' )
			);
		}

		static $printed = false;
		if ( $printed ) {
			return;
		}
		$printed = true;
		add_action(
			'wp_footer',
			function () {
				echo '<script type="application/json" id="aa-dbg-i18n">' . wp_json_encode( laao_block_debug_strings(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE ) . '</script>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON blob, not HTML.
			}
		);
	}
}
