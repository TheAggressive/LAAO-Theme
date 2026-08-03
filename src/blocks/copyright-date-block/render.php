<?php
/**
 * Server render for the Copyright Date block.
 *
 * Renders the footer copyright line, optionally as a year range.
 *
 * Exposed to this file by WordPress:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @package LAAO
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.

['showStartingYear' => $show_starting_year, 'startingYear' => $starting_year, 'companyName' => $company_name ] = $attributes;
$current_year = gmdate( 'Y' );

if ( ! empty( $show_starting_year ) && ! empty( $show_starting_year ) ) {
	$display_date = $starting_year . '–' . $current_year;
} else {
	$display_date = $current_year;
}
?>

<p <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	Copyright &copy; <?php echo esc_html( $display_date ); ?> <?php echo esc_html( $company_name ); ?>. All Rights Reserved. <a href="/terms">TERMS OF USE</a> <span>|</span> <a href="/privacy">PRIVACY POLICY</a>
</p>
