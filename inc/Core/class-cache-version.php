<?php
/**
 * Cache Version
 *
 * Versioned cache keys for grouped transients.
 *
 * Invalidating a family of transients by pattern requires a raw
 * "DELETE FROM options WHERE option_name LIKE ..." query, which is both a
 * direct DB write and silently wrong on any site running a persistent object
 * cache — there, transients never touch the options table at all, so the
 * delete matches nothing and stale markup survives indefinitely.
 *
 * Salting every key with a version counter avoids the problem: bumping the
 * counter orphans the whole previous generation in one option write, and the
 * orphans expire on their own TTL. Works identically with or without a
 * persistent object cache.
 *
 * @package LAAO
 * @since 1.9.0
 */

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Versioned cache key helper.
 *
 * @since 1.9.0
 */
class Cache_Version {

	/**
	 * Option storing the version counter for every group.
	 *
	 * @var string
	 */
	private const OPTION = 'laao_cache_versions';

	/**
	 * Current version number for a cache group.
	 *
	 * @param string $group Group name, e.g. 'highlight_posts'.
	 * @return int Version counter, starting at 1.
	 */
	public static function get( string $group ): int {
		$versions = get_option( self::OPTION, array() );

		if ( ! is_array( $versions ) ) {
			return 1;
		}

		return max( 1, (int) ( $versions[ $group ] ?? 1 ) );
	}

	/**
	 * Invalidates every cache entry in a group by advancing its version.
	 *
	 * @param string $group Group name.
	 * @return void
	 */
	public static function bump( string $group ): void {
		$versions = get_option( self::OPTION, array() );

		if ( ! is_array( $versions ) ) {
			$versions = array();
		}

		$versions[ $group ] = self::get( $group ) + 1;

		// autoload=yes: this is read on nearly every front-end request.
		update_option( self::OPTION, $versions, true );
	}

	/**
	 * Builds a version-salted transient key.
	 *
	 * @param string $group      Group name.
	 * @param string $identifier Stable identifier for this entry within the group.
	 * @return string Transient key, safe for the 172-character transient name limit.
	 */
	public static function key( string $group, string $identifier ): string {
		return sprintf( 'laao_%s_v%d_%s', $group, self::get( $group ), md5( $identifier ) );
	}
}
