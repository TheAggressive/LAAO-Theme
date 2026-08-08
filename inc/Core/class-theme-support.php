<?php
/**
 * Theme Support
 *
 * Declares the theme's core feature support, registers editor styles, preloads
 * brand fonts, and switches off the WordPress and plugin behaviour this theme
 * replaces.
 *
 * @package LAAO
 */

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers theme support and global front-end behaviour.
 */
class Theme_Support {

	/**
	 * Registers hooks and applies the theme's global filters.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'after_setup_theme', array( $this, 'register' ) );
		add_action( 'after_setup_theme', array( $this, 'add_editor_styles' ) );
		add_action( 'wp_head', array( $this, 'preload_fonts' ), 1 );

		add_filter( 'xmlrpc_enabled', '__return_false' );
		add_filter( 'jetpack_sharing_counts', '__return_false', 99 );
		add_filter( 'jetpack_implode_frontend_css', '__return_false', 99 );
		add_filter( 'rank_math/frontend/remove_credit_notice', '__return_true' );

		remove_action( 'wp_head', 'wp_generator' );
		remove_action( 'wp_head', 'rsd_link' );
		remove_action( 'wp_head', 'wlwmanifest_link' );

		remove_theme_support( 'core-block-patterns' );

		// pre_get_posts is an action, not a filter — the callback mutates the
		// query object in place and returns nothing.
		add_action(
			'pre_get_posts',
			function ( \WP_Query $query ): void {
				if ( is_search() && $query->is_main_query() ) {
					$query->set( 'posts_per_page', 10 );
				}
			}
		);
	}

	/**
	 * Declares add_theme_support() features.
	 *
	 * @return void
	 */
	public function register(): void {
		/*
		 * Without this the theme's own languages/ directory is never consulted.
		 * Just-in-time loading resolves a theme domain against WP_LANG_DIR, not
		 * against the theme, so the catalogs shipped in the release archive stay
		 * invisible until they are registered here.
		 */
		load_theme_textdomain( 'laao', get_template_directory() . '/languages' );

		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support(
			'html5',
			array( 'comment-list', 'comment-form', 'search-form', 'gallery', 'caption', 'style', 'script' )
		);
		add_theme_support(
			'post-formats',
			array( 'aside', 'image', 'video', 'status', 'quote', 'link', 'gallery', 'audio', 'chat' )
		);
		add_theme_support( 'menus' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support( 'editor-styles' );
		add_theme_support( 'responsive-embeds' );
	}

	/**
	 * Registers the compiled editor stylesheet.
	 *
	 * @return void
	 */
	public function add_editor_styles(): void {
		add_editor_style( 'dist/styles/editor.css' );
	}

	/**
	 * Emits preload hints for the brand fonts.
	 *
	 * The faces are declared inside the global-styles block, so the browser only
	 * discovers their URLs after CSS parse and style resolution. Preloading
	 * starts the fetch with the first bytes of HTML instead, removing a full
	 * round-trip from first text render.
	 *
	 * These must stay in step with the woff2 entries in theme.json. A preload
	 * whose URL does not exactly match the one the @font-face resolves to is
	 * worse than none: the file is downloaded, never used, and competes for
	 * bandwidth with the font that is.
	 *
	 * @return void
	 */
	public function preload_fonts(): void {
		$uri = get_template_directory_uri();

		// woff2 only. theme.json lists woff2 first in each src, so that is what
		// every browser in the support matrix actually loads; the .ttf sits
		// behind it purely as a fallback and must not be preloaded.
		$fonts = array(
			'/dist/assets/fonts/Anton-Regular.woff2',
			'/dist/assets/fonts/Roboto-Condensed.woff2',
		);

		foreach ( $fonts as $font ) {
			printf(
				'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin="anonymous" />' . "\n",
				esc_url( $uri . $font )
			);
		}
	}
}
