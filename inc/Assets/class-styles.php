<?php
/**
 * Styles
 *
 * Front-end stylesheet registration, plus removal of plugin styles the theme
 * supersedes.
 *
 * @package LAAO
 */

namespace LAAO\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues the theme's front-end styles.
 */
class Styles {

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'deregister_plugin_styles' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	/**
	 * Drops AdSanity's default stylesheets.
	 *
	 * Ad slots are styled entirely by the theme; loading the plugin's CSS only
	 * adds a request and rules that have to be overridden.
	 *
	 * @return void
	 */
	public function deregister_plugin_styles(): void {
		wp_dequeue_style( 'adsanity-default-css' );
		wp_deregister_style( 'adsanity-default-css' );
		wp_dequeue_style( 'adsanity-cas' );
		wp_deregister_style( 'adsanity-cas' );
	}

	/**
	 * Enqueues the compiled theme stylesheet.
	 *
	 * Scroll animation is handled by the laao/animate-on-scroll block through
	 * the Interactivity API, so no third-party animation library is loaded.
	 *
	 * @return void
	 */
	public function enqueue(): void {
		wp_enqueue_style(
			'laartsonline',
			get_template_directory_uri() . '/dist/styles/app.css',
			array(),
			wp_get_theme()->get( 'Version' ),
			'screen'
		);
	}
}
