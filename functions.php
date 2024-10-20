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
