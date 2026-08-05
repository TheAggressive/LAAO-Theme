<?php
/**
 * Theme Update Release Repository
 *
 * @package LAAO
 */

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Retrieves, validates and caches stable GitHub release metadata.
 *
 * Every URL this returns is checked against an allow-list before it leaves the
 * class, including URLs read back out of a transient. That matters because the
 * value ends up in WordPress's updater, which will download and unpack it over
 * the live theme: anything able to write that transient would otherwise have
 * arbitrary code execution. Validating on read means a poisoned cache is inert.
 */
final class Theme_Update_Release_Repository {

	/**
	 * Cached update metadata consumed by the WordPress update check.
	 *
	 * @var string
	 */
	private const UPDATE_CACHE_KEY = 'laao_theme_update';

	/**
	 * Cached GitHub release metadata.
	 *
	 * @var string
	 */
	private const RELEASE_CACHE_KEY = 'laao_theme_update_release';

	/**
	 * How long cached release metadata is considered fresh, in seconds.
	 *
	 * @var int
	 */
	private const RELEASE_CACHE_FRESHNESS = 300;

	/**
	 * Hosts the updater will talk to.
	 *
	 * @var string[]
	 */
	private const TRUSTED_HOSTS = array( 'github.com', 'api.github.com' );

	/**
	 * GitHub account owning the release repository.
	 *
	 * @var string
	 */
	private string $owner;

	/**
	 * GitHub repository holding the releases.
	 *
	 * @var string
	 */
	private string $repository;

	/**
	 * HTTP client.
	 *
	 * @var Theme_Update_Http_Client
	 */
	private Theme_Update_Http_Client $http;

	/**
	 * Constructor.
	 *
	 * @param Theme_Update_Http_Client $http       HTTP client.
	 * @param string                   $owner      GitHub account.
	 * @param string                   $repository GitHub repository.
	 */
	public function __construct(
		Theme_Update_Http_Client $http,
		string $owner = 'TheAggressive',
		string $repository = 'LAAO-Theme'
	) {
		$this->http       = $http;
		$this->owner      = $owner;
		$this->repository = $repository;
	}

	/**
	 * Repository homepage URL.
	 *
	 * @return string
	 */
	public function get_repository_url(): string {
		return "https://github.com/{$this->owner}/{$this->repository}";
	}

	/**
	 * Whether a path or URL refers to this repository.
	 *
	 * @param string $source Source URL or extracted directory path.
	 * @return bool
	 */
	public function is_repository_source( string $source ): bool {
		return str_contains( $source, $this->owner )
			&& str_contains( $source, $this->repository );
	}

	/**
	 * Version number of the newest stable release.
	 *
	 * @return string|false Version without the leading "v", or false.
	 */
	public function get_version() {
		$release_data = $this->get_release_data();

		if (
			! is_array( $release_data )
			|| ! isset( $release_data['tag_name'] )
			|| ! is_string( $release_data['tag_name'] )
		) {
			return false;
		}

		return ltrim( $release_data['tag_name'], 'v' );
	}

	/**
	 * Trusted package URL for the newest stable release.
	 *
	 * @return string|false Download URL, or false when none can be trusted.
	 */
	public function get_download_url() {
		$cached_data = get_transient( self::UPDATE_CACHE_KEY );

		if (
			is_array( $cached_data )
			&& isset( $cached_data['download_url'] )
			&& is_string( $cached_data['download_url'] )
		) {
			// Re-validated deliberately: a cached URL is not a trusted URL.
			return $this->is_allowed_package_url( $cached_data['download_url'] )
				? $cached_data['download_url']
				: false;
		}

		$release_data = $this->get_release_data();

		if ( ! is_array( $release_data ) ) {
			return $this->get_fallback_download_url();
		}

		$asset_url = $this->get_release_asset_download_url( $release_data );

		if ( $asset_url ) {
			return $asset_url;
		}

		if ( isset( $release_data['zipball_url'] ) && is_string( $release_data['zipball_url'] ) ) {
			return $this->is_allowed_package_url( $release_data['zipball_url'] )
				? $release_data['zipball_url']
				: false;
		}

		if ( isset( $release_data['tag_name'] ) && is_string( $release_data['tag_name'] ) ) {
			$tag = ltrim( $release_data['tag_name'], 'v' );
			$url = "{$this->get_repository_url()}/releases/download/v{$tag}/laao-{$tag}.zip";

			return $this->is_allowed_package_url( $url ) ? $url : false;
		}

		return false;
	}

	/**
	 * Picks the installable .zip asset from a release.
	 *
	 * Matching on the extension rather than position: a release also carries a
	 * .sha256 sidecar and GitHub does not guarantee asset order, so assets[0]
	 * could be the checksum file.
	 *
	 * @param array<string, mixed> $release_data Release payload.
	 * @return string|false Asset URL, or false when the release has no usable zip.
	 */
	public function get_release_asset_download_url( array $release_data ) {
		if ( empty( $release_data['assets'] ) || ! is_array( $release_data['assets'] ) ) {
			return false;
		}

		$zip_assets = array();

		foreach ( $release_data['assets'] as $asset ) {
			if ( ! is_array( $asset ) ) {
				continue;
			}

			$name = isset( $asset['name'] ) && is_string( $asset['name'] ) ? $asset['name'] : '';
			$url  = isset( $asset['browser_download_url'] ) && is_string( $asset['browser_download_url'] ) ? $asset['browser_download_url'] : '';

			if (
				'' === $name
				|| '' === $url
				|| ! str_ends_with( strtolower( $name ), '.zip' )
				|| ! $this->is_allowed_package_url( $url )
			) {
				continue;
			}

			$zip_assets[] = array(
				'name' => $name,
				'url'  => $url,
			);
		}

		// Prefer an asset named after this theme, so a release carrying several
		// zips still installs the right one.
		foreach ( $zip_assets as $asset ) {
			$name = sanitize_title( $asset['name'] );

			if ( str_contains( $name, sanitize_title( $this->repository ) ) || str_contains( $name, 'laao' ) ) {
				return $asset['url'];
			}
		}

		return $zip_assets[0]['url'] ?? false;
	}

	/**
	 * Whether a URL is an acceptable source for an update package.
	 *
	 * @param string $url Candidate URL.
	 * @return bool
	 */
	public function is_allowed_package_url( string $url ): bool {
		$parts = wp_parse_url( $url );

		if ( ! $this->has_trusted_origin_and_path( $parts ) ) {
			return false;
		}

		$host  = strtolower( (string) ( $parts['host'] ?? '' ) );
		$path  = strtolower( rawurldecode( (string) ( $parts['path'] ?? '' ) ) );
		$owner = strtolower( $this->owner );
		$repo  = strtolower( $this->repository );

		if ( 'github.com' === $host ) {
			return str_starts_with( $path, "/{$owner}/{$repo}/releases/download/" )
				&& str_ends_with( $path, '.zip' );
		}

		if ( 'api.github.com' === $host ) {
			return str_starts_with( $path, "/repos/{$owner}/{$repo}/zipball/" );
		}

		return false;
	}

	/**
	 * Whether a URL is an acceptable source for a checksum sidecar.
	 *
	 * @param string $url Candidate URL.
	 * @return bool
	 */
	public function is_allowed_checksum_url( string $url ): bool {
		$parts = wp_parse_url( $url );

		if ( ! $this->has_trusted_origin_and_path( $parts ) ) {
			return false;
		}

		$host  = strtolower( (string) ( $parts['host'] ?? '' ) );
		$path  = strtolower( rawurldecode( (string) ( $parts['path'] ?? '' ) ) );
		$owner = strtolower( $this->owner );
		$repo  = strtolower( $this->repository );

		return 'github.com' === $host
			&& str_starts_with( $path, "/{$owner}/{$repo}/releases/download/" )
			&& ( str_ends_with( $path, '.zip.sha256' ) || str_ends_with( $path, '.zip.sha256sum' ) );
	}

	/**
	 * Shared origin checks for any updater URL.
	 *
	 * Rejects, in order: unparsable URLs, non-HTTPS schemes, hosts outside the
	 * allow-list, non-standard ports, empty paths, embedded credentials — which
	 * is how "https://github.com@evil.example/" reads as GitHub to a human and
	 * as evil.example to a client — and any path containing "." or ".."
	 * segments, which could otherwise escape the required path prefix.
	 *
	 * @param mixed $parts Result of wp_parse_url().
	 * @return bool
	 */
	private function has_trusted_origin_and_path( $parts ): bool {
		if ( ! is_array( $parts ) ) {
			return false;
		}

		$scheme = strtolower( (string) ( $parts['scheme'] ?? '' ) );
		$host   = strtolower( (string) ( $parts['host'] ?? '' ) );
		$path   = rawurldecode( (string) ( $parts['path'] ?? '' ) );
		$port   = (int) ( $parts['port'] ?? 443 );

		if (
			'https' !== $scheme
			|| ! in_array( $host, self::TRUSTED_HOSTS, true )
			|| 443 !== $port
			|| '' === $path
			|| isset( $parts['user'] )
			|| isset( $parts['pass'] )
		) {
			return false;
		}

		$segments = explode( '/', $path );

		return ! in_array( '.', $segments, true ) && ! in_array( '..', $segments, true );
	}

	/**
	 * Newest stable release from the GitHub releases API.
	 *
	 * Drafts and prereleases are skipped and the highest valid semver tag wins.
	 * On any failure the last cached release is reused, so a GitHub outage never
	 * withdraws an update the site has already been told about.
	 *
	 * @return array<string, mixed>|false Release payload, or false.
	 */
	public function get_release_data() {
		$cached         = get_transient( self::RELEASE_CACHE_KEY );
		$cached_release = $this->get_cached_release( $cached );

		if (
			is_array( $cached )
			&& null !== $cached_release
			&& isset( $cached['checked_at'] )
			&& ( time() - (int) $cached['checked_at'] ) < self::RELEASE_CACHE_FRESHNESS
		) {
			return $cached_release;
		}

		$url = "https://api.github.com/repos/{$this->owner}/{$this->repository}/releases?per_page=20";

		$response = $this->http->get(
			$url,
			array(
				'headers' => array(
					'User-Agent' => 'LAAO-Theme-Updater',
					'Accept'     => 'application/vnd.github.v3+json',
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return $cached_release ?? false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $body ) ) {
			return $cached_release ?? false;
		}

		$best_release = $this->select_latest_stable_release( $body );

		if ( null === $best_release ) {
			return $cached_release ?? false;
		}

		set_transient(
			self::RELEASE_CACHE_KEY,
			array(
				'release_data' => $best_release,
				'checked_at'   => time(),
			),
			HOUR_IN_SECONDS
		);

		return $best_release;
	}

	/**
	 * Highest stable semver release in an API response.
	 *
	 * @param array<int, mixed> $releases Releases as returned by the API.
	 * @return array<string, mixed>|null Best release, or null when none qualify.
	 */
	private function select_latest_stable_release( array $releases ): ?array {
		$best_release = null;
		$best_version = null;

		foreach ( $releases as $release ) {
			if (
				! is_array( $release )
				|| ! empty( $release['draft'] )
				|| ! empty( $release['prerelease'] )
				|| empty( $release['tag_name'] )
				|| ! is_string( $release['tag_name'] )
			) {
				continue;
			}

			$tag = ltrim( $release['tag_name'], 'v' );

			if ( ! preg_match( '/^\d+\.\d+(\.\d+)?$/', $tag ) ) {
				continue;
			}

			if ( null === $best_version || version_compare( $tag, $best_version, '>' ) ) {
				$best_version = $tag;
				$best_release = $release;
			}
		}

		if ( null === $best_release || null === $best_version ) {
			return null;
		}

		$best_release['tag_name'] = 'v' . $best_version;

		return $best_release;
	}

	/**
	 * Extracts release data from a cache entry.
	 *
	 * @param mixed $cached Raw transient value.
	 * @return array<string, mixed>|null Release data, or null when unusable.
	 */
	private function get_cached_release( $cached ): ?array {
		if (
			! is_array( $cached )
			|| ! isset( $cached['release_data'] )
			|| ! is_array( $cached['release_data'] )
		) {
			return null;
		}

		return $cached['release_data'];
	}

	/**
	 * Conventional package URL derived from the last known version.
	 *
	 * Used only when the API is unreachable and no release metadata is cached.
	 *
	 * @return string|false Download URL, or false.
	 */
	private function get_fallback_download_url() {
		$cached_data = get_transient( self::UPDATE_CACHE_KEY );

		if (
			! is_array( $cached_data )
			|| ! isset( $cached_data['version'] )
			|| ! is_string( $cached_data['version'] )
		) {
			return false;
		}

		$tag = ltrim( $cached_data['version'], 'v' );
		$url = "{$this->get_repository_url()}/releases/download/v{$tag}/laao-{$tag}.zip";

		return $this->is_allowed_package_url( $url ) ? $url : false;
	}
}
