<?php
/**
 * Theme Update Package Verifier
 *
 * @package LAAO
 */

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Verifies an update package against its published SHA-256 before installation.
 *
 * WordPress will happily unpack whatever the updater hands it over the live
 * theme. Without this, the only thing standing between a tampered download and
 * arbitrary code execution is TLS. Checking the archive against the checksum
 * published alongside the release closes that gap, and a missing checksum is
 * treated as a failure rather than waved through — an update that cannot be
 * verified is exactly the one worth refusing.
 */
final class Theme_Update_Package_Verifier {

	/**
	 * Checksum algorithm, matching the sidecar the release pipeline publishes.
	 *
	 * @var string
	 */
	public const CHECKSUM_ALGORITHM = 'sha256';

	/**
	 * Cached update metadata key.
	 *
	 * @var string
	 */
	private const UPDATE_CACHE_KEY = 'laao_theme_update';

	/**
	 * Release repository.
	 *
	 * @var Theme_Update_Release_Repository
	 */
	private Theme_Update_Release_Repository $releases;

	/**
	 * HTTP client.
	 *
	 * @var Theme_Update_Http_Client
	 */
	private Theme_Update_Http_Client $http;

	/**
	 * Constructor.
	 *
	 * @param Theme_Update_Release_Repository $releases Release repository.
	 * @param Theme_Update_Http_Client        $http     HTTP client.
	 */
	public function __construct(
		Theme_Update_Release_Repository $releases,
		Theme_Update_Http_Client $http
	) {
		$this->releases = $releases;
		$this->http     = $http;
	}

	/**
	 * Downloads and verifies this theme's package, for upgrader_pre_download.
	 *
	 * Returning a path short-circuits WordPress's own download with the file
	 * verified here. Any other package is handed back untouched so other
	 * updates are unaffected.
	 *
	 * @param false|\WP_Error|string $reply   Result from an earlier filter.
	 * @param mixed                  $package Package URL being downloaded.
	 * @return false|\WP_Error|string Verified file path, the original reply, or an error.
	 */
	public function verify_download( $reply, $package ) {
		if ( false !== $reply ) {
			return $reply;
		}

		if ( ! is_string( $package ) || ! $this->releases->is_allowed_package_url( $package ) ) {
			return $reply;
		}

		$checksum = $this->get_checksum( $package );

		if ( ! $checksum ) {
			return new \WP_Error(
				'laao_missing_package_checksum',
				__( 'The LAAO update package is missing a SHA-256 checksum.', 'laao' )
			);
		}

		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$downloaded = download_url( $package );

		if ( is_wp_error( $downloaded ) ) {
			return $downloaded;
		}

		$actual = hash_file( self::CHECKSUM_ALGORITHM, $downloaded );

		// hash_equals rather than ===: comparison time should not depend on how
		// many leading characters matched.
		if ( ! is_string( $actual ) || ! hash_equals( strtolower( $checksum ), strtolower( $actual ) ) ) {
			wp_delete_file( $downloaded );

			return new \WP_Error(
				'laao_package_checksum_mismatch',
				__( 'The LAAO update package failed checksum verification and was not installed.', 'laao' )
			);
		}

		return $downloaded;
	}

	/**
	 * Expected checksum for a package, from cache or from the release.
	 *
	 * @param string                    $package_url  Package URL.
	 * @param array<string, mixed>|null $release_data Release payload, fetched when omitted.
	 * @return string|false Lowercase SHA-256 digest, or false when unavailable.
	 */
	public function get_checksum( string $package_url, ?array $release_data = null ) {
		$cached_data = get_transient( self::UPDATE_CACHE_KEY );

		if (
			is_array( $cached_data )
			&& isset( $cached_data['download_url'], $cached_data['checksum'] )
			&& is_string( $cached_data['download_url'] )
			&& is_string( $cached_data['checksum'] )
			&& hash_equals( $cached_data['download_url'], $package_url )
			&& $this->is_valid_sha256( $cached_data['checksum'] )
		) {
			return strtolower( $cached_data['checksum'] );
		}

		$release_data = $release_data ?? $this->releases->get_release_data();

		if ( ! is_array( $release_data ) ) {
			return false;
		}

		$checksum_url = $this->get_checksum_asset_url( $package_url, $release_data );

		if ( ! $checksum_url ) {
			return false;
		}

		return $this->fetch_checksum( $checksum_url );
	}

	/**
	 * Finds the checksum asset belonging to a package.
	 *
	 * @param string               $package_url  Package URL.
	 * @param array<string, mixed> $release_data Release payload.
	 * @return string|false Checksum asset URL, or false.
	 */
	public function get_checksum_asset_url( string $package_url, array $release_data ) {
		if ( empty( $release_data['assets'] ) || ! is_array( $release_data['assets'] ) ) {
			return false;
		}

		$package_name = $this->get_asset_name_for_url( $package_url, $release_data );

		if ( ! $package_name ) {
			return false;
		}

		$candidates = array(
			$package_name . '.sha256',
			$package_name . '.sha256sum',
		);

		foreach ( $release_data['assets'] as $asset ) {
			if ( ! is_array( $asset ) ) {
				continue;
			}

			$name = isset( $asset['name'] ) && is_string( $asset['name'] ) ? $asset['name'] : '';
			$url  = isset( $asset['browser_download_url'] ) && is_string( $asset['browser_download_url'] ) ? $asset['browser_download_url'] : '';

			if ( in_array( $name, $candidates, true ) && $this->releases->is_allowed_checksum_url( $url ) ) {
				return $url;
			}
		}

		return false;
	}

	/**
	 * Resolves the asset filename for a package URL.
	 *
	 * @param string               $package_url  Package URL.
	 * @param array<string, mixed> $release_data Release payload.
	 * @return string|false Asset name, or false.
	 */
	private function get_asset_name_for_url( string $package_url, array $release_data ) {
		foreach ( (array) ( $release_data['assets'] ?? array() ) as $asset ) {
			if ( ! is_array( $asset ) ) {
				continue;
			}

			$name = isset( $asset['name'] ) && is_string( $asset['name'] ) ? $asset['name'] : '';
			$url  = isset( $asset['browser_download_url'] ) && is_string( $asset['browser_download_url'] ) ? $asset['browser_download_url'] : '';

			if ( '' !== $name && '' !== $url && hash_equals( $url, $package_url ) ) {
				return $name;
			}
		}

		// The package may be a zipball rather than an uploaded asset, in which
		// case the name comes from the URL itself.
		$path = wp_parse_url( $package_url, PHP_URL_PATH );

		if ( ! is_string( $path ) || '' === $path ) {
			return false;
		}

		$name = basename( rawurldecode( $path ) );

		return str_ends_with( strtolower( $name ), '.zip' ) ? $name : false;
	}

	/**
	 * Fetches and parses a checksum sidecar.
	 *
	 * Accepts `sha256sum` output, where the digest is followed by the filename.
	 *
	 * @param string $checksum_url Checksum asset URL.
	 * @return string|false Lowercase digest, or false.
	 */
	private function fetch_checksum( string $checksum_url ) {
		$response = $this->http->get(
			$checksum_url,
			array(
				'headers' => array(
					'User-Agent' => 'LAAO-Theme-Updater',
				),
				'timeout' => 3,
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );

		if ( ! is_string( $body ) || ! preg_match( '/\b([a-f0-9]{64})\b/i', $body, $matches ) ) {
			return false;
		}

		$checksum = strtolower( $matches[1] );

		return $this->is_valid_sha256( $checksum ) ? $checksum : false;
	}

	/**
	 * Whether a string is a well-formed SHA-256 digest.
	 *
	 * @param string $checksum Candidate digest.
	 * @return bool
	 */
	private function is_valid_sha256( string $checksum ): bool {
		return 1 === preg_match( '/^[a-f0-9]{64}$/i', $checksum );
	}
}
