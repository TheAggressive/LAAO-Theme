<?php
/**
 * Icons
 *
 * Small SVG registry for icons rendered by PHP.
 *
 * Deliberately narrow: it holds the icons the theme actually renders rather
 * than a general-purpose library. The Aggressive Apparel theme keeps a much
 * larger set, and porting all of it to satisfy one block would have added
 * hundreds of lines of unused markup that nothing references and nothing tests.
 *
 * Adding an icon means adding a path here — a reviewable change, and the same
 * point at which someone can ask whether an inline SVG in the calling template
 * would be simpler.
 *
 * @package LAAO
 * @since 1.11.0
 */

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders inline SVG icons.
 */
final class Icons {

	/**
	 * Viewport all registered paths are drawn against.
	 *
	 * @var string
	 */
	private const VIEWBOX = '0 0 24 24';

	/**
	 * Icon slug to SVG path data.
	 *
	 * @var array<string, string>
	 */
	private const PATHS = array(
		'close'        => 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
		'arrow-left'   => 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
		'chevron-down' => 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
	);

	/**
	 * Whether an icon is registered.
	 *
	 * @param string $slug Icon slug.
	 * @return bool
	 */
	public static function exists( string $slug ): bool {
		return isset( self::PATHS[ $slug ] );
	}

	/**
	 * Returns an inline SVG for an icon.
	 *
	 * Output is assembled from a fixed path constant and escaped attributes, so
	 * it is safe to echo directly. An unknown slug returns an empty string
	 * rather than a broken element — a missing decorative icon should never
	 * take a page down.
	 *
	 * @param string                $slug Icon slug.
	 * @param array<string, scalar> $args Attributes to place on the <svg>.
	 *                                    `width` and `height` default to 24.
	 * @return string SVG markup, or an empty string when the slug is unknown.
	 */
	public static function get( string $slug, array $args = array() ): string {
		if ( ! self::exists( $slug ) ) {
			return '';
		}

		$attributes = array_merge(
			array(
				'width'   => 24,
				'height'  => 24,
				'viewBox' => self::VIEWBOX,
				'fill'    => 'currentColor',
				'xmlns'   => 'http://www.w3.org/2000/svg',
			),
			$args
		);

		$rendered = '';

		foreach ( $attributes as $name => $value ) {
			$rendered .= sprintf(
				' %s="%s"',
				esc_attr( (string) $name ),
				esc_attr( (string) $value )
			);
		}

		return sprintf(
			'<svg%s><path d="%s" /></svg>',
			$rendered,
			esc_attr( self::PATHS[ $slug ] )
		);
	}
}
