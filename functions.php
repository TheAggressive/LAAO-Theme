<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once get_template_directory() . '/inc/class-autoloader.php';

new LAAO_Autoloader();

LAAO\Bootstrap::get_instance();

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
