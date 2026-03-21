<?php

namespace LAAO\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Scripts {

	private array $editorial_post_types;
	private array $cover_post_type;
	private array $wh_post_types;

	public function __construct( array $editorial_post_types, array $cover_post_type, array $wh_post_types ) {
		$this->editorial_post_types = $editorial_post_types;
		$this->cover_post_type      = $cover_post_type;
		$this->wh_post_types        = $wh_post_types;
	}

	public function init(): void {
		add_action( 'init', array( $this, 'register_block_plugins' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_plugins' ) );
		add_filter( 'script_loader_tag', array( $this, 'defer' ), 10, 1 );
	}

	public function enqueue(): void {
		$version = wp_get_theme()->get( 'Version' );
		$uri     = get_template_directory_uri();

		wp_enqueue_script( 'laartsonline-app', $uri . '/dist/scripts/app.js', array(), $version, true );

		wp_enqueue_script( 'gsap-js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js', array(), '3.11.3', true );
		wp_enqueue_script( 'gsap-scrolltrigger-js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/ScrollTrigger.min.js', array(), '3.11.3', true );
		wp_enqueue_script( 'lenissmoothscroll-js', 'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js', array(), '1.0.29', true );
		wp_enqueue_script( 'aos-js', 'https://unpkg.com/aos@next/dist/aos.js', array(), '2.3.4', true );

		wp_enqueue_script( 'laartsonline-gsap-js', $uri . '/dist/scripts/gsap.js', array( 'gsap-js' ), $version, true );
		wp_enqueue_script( 'laartsonline-smoothscroll-js', $uri . '/dist/scripts/smoothscroll.js', array( 'lenissmoothscroll-js' ), $version, true );
	}

	public function register_block_plugins(): void {
		$version = wp_get_theme()->get( 'Version' );
		$uri     = get_template_directory_uri();
		$deps    = array( 'wp-plugins', 'wp-editor', 'react' );

		$plugins = array(
			'editorial-block-plugin'      => 'editorial-block-plugin.js',
			'image-credits-block-plugin'  => 'image-credits-block-plugin.js',
			'cover-block-plugin'          => 'cover-block-plugin.js',
			'wh-image-credit-block-plugin' => 'wh-image-credit-block-plugin.js',
			'wh-link-to-block-plugin'     => 'wh-link-to-block-plugin.js',
			'location-block-plugin'       => 'location-block-plugin.js',
			'hair-makeup-block-plugin'    => 'hair-makeup-credits-block-plugin.js',
			'highlight-block-plugin'      => 'highlight-block-plugin.js',
		);

		foreach ( $plugins as $handle => $file ) {
			wp_register_script( $handle, $uri . '/dist/scripts/' . $file, $deps, $version, false );
		}
	}

	public function enqueue_block_plugins(): void {
		if ( in_array( get_post_type(), $this->editorial_post_types, true ) ) {
			wp_enqueue_script( 'editorial-block-plugin' );
			wp_enqueue_script( 'image-credits-block-plugin' );
			wp_enqueue_script( 'location-block-plugin' );
			wp_enqueue_script( 'hair-makeup-block-plugin' );
			wp_enqueue_script( 'highlight-block-plugin' );
		}

		if ( in_array( get_post_type(), $this->cover_post_type, true ) ) {
			wp_enqueue_script( 'cover-block-plugin' );
		}

		if ( in_array( get_post_type(), $this->wh_post_types, true ) ) {
			wp_enqueue_script( 'wh-link-to-block-plugin' );
			wp_enqueue_script( 'wh-image-credit-block-plugin' );
		}
	}

	public function defer( string $tag ): string {
		$no_defer = array(
			'jquery.min.js',
			'jquery.js',
			'i18n.min.js',
			'i18n.js',
			'a11y.min.js',
			'a11y.js',
			'dom-ready.min.js',
			'dom-ready.js',
			'wp-polyfill.min.js',
			'wp-polyfill.js',
			'hooks.min.js',
			'hooks.js',
			'wp-embed.min.js',
			'wp-embed.js',
			'index.js',
		);

		foreach ( $no_defer as $val ) {
			if ( strpos( $tag, $val ) !== false ) {
				return $tag;
			}
		}

		if ( is_admin() || strpos( $tag, '.js' ) === false ) {
			return $tag;
		}

		// Guard against double-adding defer (e.g. already-deferred tags).
		if ( strpos( $tag, ' defer' ) !== false ) {
			return $tag;
		}

		return str_replace( ' src', ' defer src', $tag );
	}
}
