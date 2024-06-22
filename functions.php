<?php

require_once get_template_directory() . '/inc/class-laao-setup.php';

if ( class_exists( 'LAAO_Setup' ) ) {
	new LAAO_Setup();
}

add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );
