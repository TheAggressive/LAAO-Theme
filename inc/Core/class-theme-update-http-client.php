<?php
/**
 * Theme Update HTTP Client
 *
 * @package LAAO
 */

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Bounded HTTP requests for the theme updater.
 *
 * Uses wp_safe_remote_get rather than wp_remote_get: the safe variant refuses
 * to resolve private and loopback addresses, so a redirect toward an internal
 * host cannot turn the updater into an SSRF primitive.
 *
 * Timeouts are clamped rather than trusted. The updater runs on admin page
 * loads, so an unbounded request would hang the dashboard on a slow or hostile
 * endpoint.
 */
final class Theme_Update_Http_Client {

	/**
	 * Longest a single updater request may take, in seconds.
	 *
	 * @var int
	 */
	private const MAX_TIMEOUT = 3;

	/**
	 * Performs a GET request against an updater endpoint.
	 *
	 * @param string               $url  HTTPS URL. Callers must have already
	 *                                   checked it against the repository
	 *                                   allow-list.
	 * @param array<string, mixed> $args WordPress HTTP API arguments.
	 * @return array<string, mixed>|\WP_Error Response array, or an error.
	 */
	public function get( string $url, array $args = array() ): array|\WP_Error {
		$args['timeout'] = min(
			self::MAX_TIMEOUT,
			max( 1, (int) ( $args['timeout'] ?? self::MAX_TIMEOUT ) )
		);

		// vip_safe_wp_remote_get adds a circuit breaker that stops retrying a
		// failing host. Only present on WordPress VIP; wp_safe_remote_get is
		// the equivalent everywhere else.
		if ( function_exists( 'vip_safe_wp_remote_get' ) ) {
			$response = \vip_safe_wp_remote_get( $url, false, 3, $args['timeout'], 20, $args );

			return is_array( $response ) ? $response : new \WP_Error( 'laao_remote_request_failed' );
		}

		return wp_safe_remote_get( $url, $args );
	}
}
