<?php

require_once get_template_directory() . '/inc/class-laao-setup.php';

if ( class_exists( 'LAAO_Setup' ) ) {
	new LAAO_Setup();
}

add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );

// function include_feature_image_caption( $block_content, $block ) {
//  if ( isset( $block['attrs']['className'] ) && 'laao-post-featured-image' === $block['attrs']['className'] ) {
//      $dom = new DOMDocument();
//      $dom->loadHTML( $block_content );
//      $images = $dom->getElementsByTagName( 'img' );
//      foreach ( $images as $image ) {
//          $caption = wp_kses( get_post_meta( get_the_ID(), 'picture_id', true ), 'laao' );
//          if ( ! empty( $caption ) ) {
//              $figcaption          = $dom->createElement( 'figcaption' );
//              $figcaption_fragment = $dom->createDocumentFragment();
//              $figcaption_fragment->appendXML( $caption );
//              $figcaption->appendChild( $figcaption_fragment );
//              $figcaption->setAttribute( 'class', 'wp-element-caption' );
// 				// phpcs:ignore
// 				$figure = $image->parentNode;
//              $figure->appendChild( $figcaption );
//          }
//      }
//      $block_content = $dom->saveHTML();
//  }
//  return $block_content;
// }
// add_filter( 'render_block_core/post-featured-image', 'include_feature_image_caption', 10, 2 );
