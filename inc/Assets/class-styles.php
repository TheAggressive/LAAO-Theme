<?php

namespace LAAO\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Styles {

	public function init(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'deregister_plugin_styles' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
	}

	public function deregister_plugin_styles(): void {
		wp_dequeue_style( 'adsanity-default-css' );
		wp_deregister_style( 'adsanity-default-css' );
		wp_dequeue_style( 'adsanity-cas' );
		wp_deregister_style( 'adsanity-cas' );
	}

	public function enqueue(): void {
		wp_enqueue_style(
			'laartsonline',
			get_template_directory_uri() . '/dist/styles/app.css',
			array(),
			wp_get_theme()->get( 'Version' ),
			'screen'
		);

		wp_enqueue_style(
			'aos-css',
			'https://unpkg.com/aos@next/dist/aos.css',
			array(),
			'2.3.4'
		);
	}
}
