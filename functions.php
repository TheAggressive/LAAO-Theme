<?php

require_once get_template_directory() . '/inc/class-laao-setup.php';

if ( class_exists( 'LAAO_Setup' ) ) {
	new LAAO_Setup();
}

add_filter(
	'pre_get_posts',
	function ( $query ) {
		if ( is_search() && $query->is_main_query() ) {
			$query->set( 'posts_per_page', 10 );
		}
	}
);

function sidebar_plugin_register() {
	wp_register_script(
		'plugin-sidebar-js',
		get_template_directory_uri() . '/dist/scripts/plugin-post-meta.js',
		array( 'wp-plugins', 'wp-editor', 'react' ),
		wp_get_theme()->get( 'Version' ),
		false
	);
}
add_action( 'init', 'sidebar_plugin_register' );

// function sidebar_plugin_script_enqueue() {
//  wp_enqueue_script( 'plugin-sidebar-js' );
// }
// add_action( 'enqueue_block_editor_assets', 'sidebar_plugin_script_enqueue' );


function myguten_register_post_meta() {
	register_post_meta(
		'arts',
		'author',
		array(
			'show_in_rest' => true,
			'single'       => true,
			'type'         => 'string',
		)
	);
}
add_action( 'init', 'myguten_register_post_meta' );

add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );
