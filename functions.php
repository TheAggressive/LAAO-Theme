<?php

require_once get_template_directory() . '/inc/class-laao-setup.php';

if ( class_exists( 'LAAO_Setup' ) ) {
	new LAAO_Setup();
}

add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );


function include_feature_image_caption( $block_content, $block ) {
	if ( isset( $block['attrs']['className'] ) && 'laao-post-featured-image' === $block['attrs']['className'] ) {
		$caption       = '<figcaption class="wp-element-caption">' . get_post_meta( get_the_ID(), 'picture_id', true ) . '</figcaption>';
		$block_content = str_replace( '</figure>', $caption . '</figure>', $block_content );
	}
	return $block_content;
}
add_filter( 'render_block_core/post-featured-image', 'include_feature_image_caption', 10, 2 );
