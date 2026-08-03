<?php
/**
 * Theme bootstrap.
 *
 * Registers the autoloader, then hands off to LAAO\Bootstrap which wires every
 * theme service through the container. Keep this file thin — behaviour belongs
 * in a service class under inc/, not here.
 *
 * @package LAAO
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once get_template_directory() . '/inc/class-autoloader.php';

new LAAO\Autoloader();

LAAO\Bootstrap::get_instance();

// ACF hides the Custom Fields meta box by default; the highlight date fields
// are edited through it, so keep it visible.
add_filter( 'acf/settings/remove_wp_meta_box', '__return_false' );

/**
 * Uses the bare term/author/post-type name as the archive title.
 *
 * Core prefixes these with "Category:", "Author:" and so on, which the archive
 * templates render themselves.
 *
 * @param string $title Default archive title.
 * @return string Title without the type prefix.
 */
function laao_archive_title( string $title ): string {
	// single_term_title() and post_type_archive_title() both return null when
	// the queried object is missing — fall back to the core title rather than
	// blanking the heading.
	if ( is_category() || is_tag() || is_tax() ) {
		return single_term_title( '', false ) ?? $title;
	}

	if ( is_author() ) {
		return (string) get_the_author();
	}

	if ( is_post_type_archive() ) {
		return post_type_archive_title( '', false ) ?? $title;
	}

	return $title;
}
add_filter( 'get_the_archive_title', 'laao_archive_title' );
