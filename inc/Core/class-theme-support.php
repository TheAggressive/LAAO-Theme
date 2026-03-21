<?php

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Theme_Support {

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

		add_filter(
			'pre_get_posts',
			function ( $query ) {
				if ( is_search() && $query->is_main_query() ) {
					$query->set( 'posts_per_page', 10 );
				}
			}
		);
	}

	public function register(): void {
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

	public function add_editor_styles(): void {
		add_editor_style( 'dist/styles/editor.css' );
	}

	public function preload_fonts(): void {
		$uri = esc_url( get_template_directory_uri() );
		echo '<link rel="preload" href="' . $uri . '/dist/assets/fonts/Anton-Regular.ttf" as="font" type="font/ttf" crossorigin="anonymous" />' . "\n";
		echo '<link rel="preload" href="' . $uri . '/dist/assets/fonts/Roboto-Condensed.ttf" as="font" type="font/ttf" crossorigin="anonymous" />' . "\n";
	}
}
