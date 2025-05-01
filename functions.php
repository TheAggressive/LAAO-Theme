<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once get_template_directory() . '/inc/class-laao-setup.php';
require_once get_template_directory() . '/inc/class-laao-theme-updater.php';

if ( class_exists( 'LAAO_Setup' ) ) {
	new LAAO_Setup();
}

if ( class_exists( 'LAAO_Theme_Updater' ) ) {
	new LAAO_Theme_Updater();
}

add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );

add_filter(
	'get_the_archive_title',
	function ( $title ) {
		if ( is_category() || is_tag() || is_tax() ) {
			return single_term_title( '', false );
		} elseif ( is_author() ) {
			return get_the_author();
		} elseif ( is_post_type_archive() ) {
			return post_type_archive_title( '', false );
		}
		return $title;
	}
);
