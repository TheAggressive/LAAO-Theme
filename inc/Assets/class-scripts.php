<?php
/**
 * Scripts
 *
 * Front-end and block-editor script registration.
 *
 * Editor sidebar plugins are registered once and enqueued per post type, so a
 * cover screen never loads the What's Hot panels and vice versa.
 *
 * @package LAAO
 */

namespace LAAO\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and enqueues the theme's JavaScript.
 */
class Scripts {

	/**
	 * Post types that get the editorial sidebar plugins.
	 *
	 * @var string[]
	 */
	private array $editorial_post_types;

	/**
	 * Post types that get the cover sidebar plugin.
	 *
	 * @var string[]
	 */
	private array $cover_post_type;

	/**
	 * Post types that get the What's Hot sidebar plugins.
	 *
	 * @var string[]
	 */
	private array $wh_post_types;

	/**
	 * Constructor.
	 *
	 * @param string[] $editorial_post_types Post types receiving editorial panels.
	 * @param string[] $cover_post_type      Post types receiving the cover panel.
	 * @param string[] $wh_post_types        Post types receiving What's Hot panels.
	 */
	public function __construct( array $editorial_post_types, array $cover_post_type, array $wh_post_types ) {
		$this->editorial_post_types = $editorial_post_types;
		$this->cover_post_type      = $cover_post_type;
		$this->wh_post_types        = $wh_post_types;
	}

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register_block_plugins' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_plugins' ) );
		add_filter( 'script_loader_tag', array( $this, 'defer' ), 10, 1 );
	}

	/**
	 * Enqueues front-end scripts.
	 *
	 * The app.js entry point is intentionally not enqueued: it is empty, so
	 * loading it cost every visitor a request for zero bytes of behaviour. It
	 * remains as an entry point for future front-end code — enqueue it again
	 * when it has content.
	 *
	 * GSAP (with ScrollTrigger) and Lenis are compiled into dist/scripts by
	 * webpack from the npm packages in package.json — src/scripts/gsap.js and
	 * src/scripts/smoothscroll.js import them directly. Nothing is loaded from
	 * a third-party CDN: doing so would mean an uncontrolled request on every
	 * page view and a second, drifting copy of a library already in the bundle.
	 *
	 * @return void
	 */
	public function enqueue(): void {
		$version = wp_get_theme()->get( 'Version' );
		$uri     = get_template_directory_uri();

		wp_enqueue_script( 'laartsonline-gsap-js', $uri . '/dist/scripts/gsap.js', array(), $version, true );
		wp_enqueue_script( 'laartsonline-smoothscroll-js', $uri . '/dist/scripts/smoothscroll.js', array(), $version, true );
	}

	/**
	 * Registers every editor sidebar plugin without enqueuing any of them.
	 *
	 * Dependencies and versions come from the .asset.php manifests webpack
	 * writes beside each bundle. They were previously hardcoded as
	 * `wp-plugins, wp-editor, react`, which understated them: the manifests
	 * also list wp-components, wp-core-data, wp-data, wp-primitives,
	 * react-jsx-runtime and — the one that matters here — wp-i18n. That worked
	 * only because wp-editor happens to pull most of them in transitively, so
	 * the day WordPress trims that dependency chain the panels break with no
	 * change on our side.
	 *
	 * The manifest version is a content hash, so a bundle busts caches when it
	 * actually changes rather than once per theme release.
	 *
	 * @return void
	 */
	public function register_block_plugins(): void {
		$uri = get_template_directory_uri();

		$plugins = array(
			'editorial-block-plugin'       => 'editorial-block-plugin',
			'image-credits-block-plugin'   => 'image-credits-block-plugin',
			'cover-block-plugin'           => 'cover-block-plugin',
			'wh-image-credit-block-plugin' => 'wh-image-credit-block-plugin',
			'wh-link-to-block-plugin'      => 'wh-link-to-block-plugin',
			'location-block-plugin'        => 'location-block-plugin',
			'hair-makeup-block-plugin'     => 'hair-makeup-credits-block-plugin',
			'highlight-block-plugin'       => 'highlight-block-plugin',
		);

		foreach ( $plugins as $handle => $file ) {
			$asset = $this->read_asset_manifest( $file );

			wp_register_script(
				$handle,
				$uri . '/dist/scripts/' . $file . '.js',
				$asset['dependencies'],
				$asset['version'],
				false
			);

			/*
			 * Blocks registered from block.json get this from their `textdomain`
			 * field. These panels are registered by hand, so without this call
			 * every __() in them returns English regardless of site locale.
			 */
			wp_set_script_translations( $handle, 'laao', get_template_directory() . '/languages' );
		}
	}

	/**
	 * Reads the webpack-generated dependency manifest for a bundle.
	 *
	 * Falls back to the theme version and no dependencies when the manifest is
	 * absent or malformed. A missing manifest means an incomplete build, and a
	 * script that loads without its dependencies is easier to diagnose in the
	 * console than an editor that silently drops a panel.
	 *
	 * @param string $file Bundle basename, without extension.
	 * @return array{dependencies: string[], version: string}
	 */
	private function read_asset_manifest( string $file ): array {
		$fallback = array(
			'dependencies' => array(),
			'version'      => (string) wp_get_theme()->get( 'Version' ),
		);

		$path = get_template_directory() . '/dist/scripts/' . $file . '.asset.php';

		if ( ! is_readable( $path ) ) {
			return $fallback;
		}

		$manifest = require $path;

		if ( ! is_array( $manifest ) ) {
			return $fallback;
		}

		$dependencies = $manifest['dependencies'] ?? array();
		$version      = $manifest['version'] ?? $fallback['version'];

		return array(
			'dependencies' => is_array( $dependencies ) ? array_map( 'strval', $dependencies ) : array(),
			'version'      => is_scalar( $version ) ? (string) $version : $fallback['version'],
		);
	}

	/**
	 * Enqueues only the sidebar plugins relevant to the post type being edited.
	 *
	 * @return void
	 */
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

	/**
	 * Adds a defer attribute to front-end script tags.
	 *
	 * Skips the handles listed below: they either provide globals that inline
	 * scripts read during parse, or are required before deferred code runs.
	 *
	 * @param string $tag The full script tag markup.
	 * @return string The tag, deferred where safe.
	 */
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
