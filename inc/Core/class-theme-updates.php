<?php
/**
 * Theme Updates
 *
 * Serves theme updates from GitHub releases so the site can update itself
 * without the WordPress.org directory.
 *
 * The flow mirrors what wordpress.org would provide: advertise a newer version
 * through the update_themes transient, describe it through the themes_api
 * filter, and rename the extracted package so the update lands on top of the
 * installed theme rather than beside it.
 *
 * @package LAAO
 */

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * GitHub-backed theme update provider.
 */
class Theme_Updates {

	/**
	 * GitHub account owning the release repository.
	 *
	 * @var string
	 */
	private string $repo_owner = 'TheAggressive';

	/**
	 * GitHub repository holding the releases.
	 *
	 * @var string
	 */
	private string $repo_name = 'LAAO-Theme';

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ), 100, 1 );
		add_filter( 'upgrader_source_selection', array( $this, 'rename_package' ), 10, 2 );
		add_filter( 'themes_api', array( $this, 'themes_api' ), 10, 3 );
		add_action( 'admin_notices', array( $this, 'admin_update_notice' ) );
		add_action( 'load-update-core.php', array( $this, 'force_fresh_check' ) );
	}

	/**
	 * Drops cached release data so the next check hits GitHub.
	 *
	 * Hooked to the Updates screen so "Check again" is not answered from an
	 * hour-old transient.
	 *
	 * @return void
	 */
	public function force_fresh_check(): void {
		delete_transient( 'laao_theme_update' );
		delete_transient( 'laao_theme_update_release' );
		wp_update_themes();
	}

	/**
	 * Advertises a newer GitHub release through the update transient.
	 *
	 * @param mixed $transient The update_themes site transient.
	 * @return mixed The transient, with this theme's update added when one exists.
	 */
	public function check_for_update( mixed $transient ): mixed {
		// Core seeds this transient as a stdClass. Anything else came from a
		// third party mangling the filter chain — hand it back untouched
		// rather than writing properties onto an unknown object.
		if ( ! $transient instanceof \stdClass || empty( $transient->checked ) ) {
			return $transient;
		}

		$theme           = wp_get_theme();
		$theme_slug      = $theme->get_stylesheet();
		$current_version = $theme->get( 'Version' );
		$source_version  = $this->get_github_version();

		if ( ! $source_version ) {
			return $transient;
		}

		if ( version_compare( $source_version, $current_version, '>' ) ) {
			$download_url = $this->get_download_url();

			if ( ! $download_url ) {
				return $transient;
			}

			if ( ! isset( $transient->response ) ) {
				$transient->response = array();
			}

			$transient->response[ $theme_slug ] = array(
				'theme'       => $theme_slug,
				'new_version' => $source_version,
				'url'         => "https://github.com/{$this->repo_owner}/{$this->repo_name}",
				'package'     => $download_url,
			);

			$release_data = $this->get_github_release_data();
			if ( $release_data ) {
				set_transient(
					'laao_theme_update',
					array(
						'version'      => $source_version,
						'download_url' => $download_url,
						'release_data' => $release_data,
						'checked_at'   => time(),
					),
					HOUR_IN_SECONDS
				);
			}
		}

		return $transient;
	}

	/**
	 * Version number of the newest stable release.
	 *
	 * @return string|false Version without the leading "v", or false if unknown.
	 */
	private function get_github_version(): string|false {
		$release_data = $this->get_github_release_data();

		if ( ! $release_data ) {
			return false;
		}

		if ( isset( $release_data['tag_name'] ) && is_string( $release_data['tag_name'] ) ) {
			return ltrim( $release_data['tag_name'], 'v' );
		}

		return false;
	}

	/**
	 * Package URL for the newest stable release.
	 *
	 * Prefers an uploaded release asset, then the auto-generated zipball, then
	 * a conventional asset path derived from the tag.
	 *
	 * @return string|false Download URL, or false if none can be determined.
	 */
	private function get_download_url(): string|false {
		$cached_data = get_transient( 'laao_theme_update' );
		if ( $cached_data && isset( $cached_data['download_url'] ) ) {
			return $cached_data['download_url'];
		}

		$release_data = $this->get_github_release_data();

		if ( ! $release_data ) {
			return $this->get_fallback_download_url();
		}

		// Match on the .zip extension rather than taking assets[0]: a release
		// also carries a .sha256 sidecar, and GitHub does not guarantee upload
		// order. Handing WordPress the checksum file to install would fail in a
		// confusing way.
		$asset_url = $this->find_zip_asset( $release_data );

		if ( false !== $asset_url ) {
			return $asset_url;
		}

		if ( isset( $release_data['zipball_url'] ) ) {
			return $release_data['zipball_url'];
		}

		if ( isset( $release_data['tag_name'] ) ) {
			$tag = ltrim( $release_data['tag_name'], 'v' );
			return "https://github.com/{$this->repo_owner}/{$this->repo_name}/releases/download/v{$tag}/laao-{$tag}.zip";
		}

		return false;
	}

	/**
	 * Finds the installable .zip asset on a release.
	 *
	 * @param array<string, mixed> $release_data Release payload from GitHub.
	 * @return string|false Asset download URL, or false when the release has none.
	 */
	private function find_zip_asset( array $release_data ): string|false {
		if ( ! isset( $release_data['assets'] ) || ! is_array( $release_data['assets'] ) ) {
			return false;
		}

		foreach ( $release_data['assets'] as $asset ) {
			if ( ! is_array( $asset ) || ! isset( $asset['browser_download_url'] ) ) {
				continue;
			}

			$url = $asset['browser_download_url'];

			if ( is_string( $url ) && str_ends_with( strtolower( $url ), '.zip' ) ) {
				return $url;
			}
		}

		return false;
	}

	/**
	 * Package URL derived from cached data when the API is unreachable.
	 *
	 * @return string|false Download URL, or false if nothing is cached.
	 */
	private function get_fallback_download_url(): string|false {
		$cached_data = get_transient( 'laao_theme_update' );
		if ( $cached_data && isset( $cached_data['version'] ) ) {
			$tag = ltrim( $cached_data['version'], 'v' );
			return "https://github.com/{$this->repo_owner}/{$this->repo_name}/releases/download/v{$tag}/laao-{$tag}.zip";
		}

		return false;
	}

	/**
	 * Newest stable release from the GitHub releases API.
	 *
	 * Skips drafts and prereleases and returns the highest valid semver tag.
	 * On any failure the last cached release is reused, so a GitHub outage
	 * never removes an update the site has already been told about.
	 *
	 * @return array<string, mixed>|false Release payload, or false if unavailable.
	 */
	private function get_github_release_data(): array|false {
		$cached = get_transient( 'laao_theme_update_release' );
		if ( $cached && isset( $cached['release_data'], $cached['checked_at'] ) ) {
			if ( ( time() - (int) $cached['checked_at'] ) < 300 ) {
				return $cached['release_data'];
			}
		}

		$url      = "https://api.github.com/repos/{$this->repo_owner}/{$this->repo_name}/releases?per_page=20";
		$response = wp_remote_get(
			$url,
			array(
				'headers' => array(
					'User-Agent' => 'LAAO-Theme-Updater',
					'Accept'     => 'application/vnd.github.v3+json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return ( $cached && isset( $cached['release_data'] ) ) ? $cached['release_data'] : false;
		}

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return ( $cached && isset( $cached['release_data'] ) ) ? $cached['release_data'] : false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $body ) ) {
			return ( $cached && isset( $cached['release_data'] ) ) ? $cached['release_data'] : false;
		}

		$best_release = null;
		$best_version = null;

		foreach ( $body as $release ) {
			if ( ! empty( $release['draft'] ) || ! empty( $release['prerelease'] ) ) {
				continue;
			}

			if ( empty( $release['tag_name'] ) || ! is_string( $release['tag_name'] ) ) {
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
			return ( $cached && isset( $cached['release_data'] ) ) ? $cached['release_data'] : false;
		}

		$best_release['tag_name'] = 'v' . $best_version;

		set_transient(
			'laao_theme_update_release',
			array(
				'release_data' => $best_release,
				'checked_at'   => time(),
			),
			HOUR_IN_SECONDS
		);

		return $best_release;
	}

	/**
	 * Renames the extracted package directory to the theme's stylesheet slug.
	 *
	 * GitHub release zips extract to "repo-name-tag/", which WordPress would
	 * install as a second, differently-slugged theme. Renaming the source
	 * directory before install makes the update land on top of the existing one.
	 *
	 * @param string $source        Path to the extracted package directory.
	 * @param string $remote_source Path to the downloaded package's parent directory.
	 * @return string The (possibly renamed) source path.
	 */
	public function rename_package( string $source, string $remote_source ): string {
		$is_our_release = false !== strpos( $remote_source, $this->repo_owner )
			|| false !== strpos( $remote_source, $this->repo_name );

		if ( ! $is_our_release ) {
			return $source;
		}

		$actual_theme_slug = wp_get_theme()->get_stylesheet();

		if ( basename( $source ) === $actual_theme_slug ) {
			return $source;
		}

		$target_path = trailingslashit( dirname( $source ) ) . $actual_theme_slug;

		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			\WP_Filesystem();
		}

		if ( $wp_filesystem && $wp_filesystem->move( $source, $target_path ) ) {
			return $target_path;
		}

		return $source;
	}

	/**
	 * Supplies the "View details" payload for this theme.
	 *
	 * @param mixed  $result Response from a previous filter, or false.
	 * @param string $action Requested themes_api action.
	 * @param mixed  $args   Request arguments; expected to carry a slug.
	 * @return mixed Theme details object for this theme, or $result untouched.
	 */
	public function themes_api( mixed $result, string $action, mixed $args ): mixed {
		if ( 'theme_information' !== $action || ! isset( $args->slug ) ) {
			return $result;
		}

		$theme      = wp_get_theme();
		$theme_slug = $theme->get_stylesheet();

		if ( $args->slug !== $theme_slug ) {
			return $result;
		}

		$release_data = $this->get_github_release_data();

		if ( ! $release_data ) {
			return $result;
		}

		$download_link = $this->get_download_url();

		// style.css headers are the source of truth; these defaults only apply
		// when a header is missing, and must stay in step with style.css.
		$requires_wp  = $this->header_or( $theme, 'RequiresWP', '6.8' );
		$tested_up_to = $this->header_or( $theme, 'TestedUpTo', '7.0' );
		$requires_php = $this->header_or( $theme, 'RequiresPHP', '8.4' );
		$theme_uri    = $this->header_or( $theme, 'ThemeURI', (string) ( $release_data['html_url'] ?? '' ) );

		return (object) array(
			'name'           => $theme->get( 'Name' ),
			'slug'           => $theme_slug,
			'version'        => ltrim( $release_data['tag_name'], 'v' ),
			'author'         => $theme->get( 'Author' ),
			'author_profile' => $theme->get( 'AuthorURI' ),
			'requires'       => $requires_wp,
			'tested'         => $tested_up_to,
			'requires_php'   => $requires_php,
			'rating'         => 100,
			'num_ratings'    => 1,
			'ratings'        => array( 5 => 1 ),
			'downloaded'     => 0,
			'last_updated'   => $release_data['published_at'],
			'homepage'       => $theme_uri,
			'sections'       => array(
				'description' => $theme->get( 'Description' ),
				'changelog'   => $this->format_changelog( $release_data ),
			),
			'download_link'  => false !== $download_link && '' !== $download_link
				? $download_link
				: (string) ( $release_data['zipball_url'] ?? '' ),
			'tags'           => array(),
			'screenshots'    => array(),
		);
	}

	/**
	 * Reads a style.css header, falling back when it is absent or empty.
	 *
	 * WP_Theme::get() returns false for an unknown header, an empty string for a
	 * declared-but-blank one, and an array for list headers such as Tags. Only a
	 * non-empty string counts as "set" for the scalar headers read here.
	 *
	 * @param \WP_Theme $theme    Theme to read from.
	 * @param string    $header   Header name.
	 * @param string    $fallback Value to use when the header is not set.
	 * @return string The header value, or the fallback.
	 */
	private function header_or( \WP_Theme $theme, string $header, string $fallback ): string {
		$value = $theme->get( $header );

		if ( ! is_string( $value ) || '' === $value ) {
			return $fallback;
		}

		return $value;
	}

	/**
	 * Renders the admin notice announcing an available update.
	 *
	 * Suppressed while an upgrade is actually running so the notice does not
	 * appear on the progress screen.
	 *
	 * @return void
	 */
	public function admin_update_notice(): void {
		$theme      = wp_get_theme();
		$theme_slug = $theme->get_stylesheet();
		$transient  = get_site_transient( 'update_themes' );

		if ( ! isset( $transient->response[ $theme_slug ] ) ) {
			return;
		}

		if ( ! current_user_can( 'update_themes' ) ) {
			return;
		}

		// Hide during active upgrade process.
		$action = isset( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $action ) {
			if ( 'upgrade-theme' === $action && isset( $_GET['theme'] ) && sanitize_text_field( wp_unslash( $_GET['theme'] ) ) === $theme_slug ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				return;
			}
			if ( in_array( $action, array( 'do-theme-upgrade', 'do-core-upgrade' ), true ) ) {
				return;
			}
		}

		$update_data     = $transient->response[ $theme_slug ];
		$current_version = $theme->get( 'Version' );

		$message = sprintf(
			/* translators: 1: theme name, 2: current version, 3: new version */
			__( 'A new version of %1$s is available. You have version %2$s and the latest version is %3$s.', 'laao' ),
			'<strong>' . $theme->get( 'Name' ) . '</strong>',
			$current_version,
			$update_data['new_version']
		);

		$update_url = wp_nonce_url(
			admin_url( 'update.php?action=upgrade-theme&theme=' . $theme_slug ),
			'upgrade-theme_' . $theme_slug
		);

		printf(
			'<div class="notice notice-info is-dismissible"><p>%1$s <a href="%2$s">%3$s</a></p></div>',
			wp_kses( $message, array( 'strong' => array() ) ),
			esc_url( $update_url ),
			esc_html__( 'Update now', 'laao' )
		);
	}

	/**
	 * Builds the changelog section shown in the theme details modal.
	 *
	 * @param array<string, mixed> $release_data Release payload from GitHub.
	 * @return string HTML changelog.
	 */
	private function format_changelog( array $release_data ): string {
		$version   = ltrim( $release_data['tag_name'], 'v' );
		$date      = gmdate( 'F j, Y', strtotime( $release_data['published_at'] ) );
		$changelog = "<h4>{$version} - {$date}</h4>\n";

		if ( ! empty( $release_data['body'] ) && is_string( $release_data['body'] ) ) {
			$changelog .= '<p>' . $this->format_release_body( $release_data['body'] ) . "</p>\n";
		} else {
			$changelog .= '<p>No changelog available for this release.</p>';
		}

		return $changelog;
	}

	/**
	 * Converts a GitHub release body from Markdown to display HTML.
	 *
	 * @param string $body Raw release body.
	 * @return string Escaped HTML suitable for the details modal.
	 */
	private function format_release_body( string $body ): string {
		$body = esc_html( $body );
		$body = (string) preg_replace( '/\*\*(.*?)\*\*/', '<strong>$1</strong>', $body );
		$body = (string) preg_replace( '/\*(.*?)\*/', '<em>$1</em>', $body );
		$body = (string) preg_replace( '/`(.*?)`/', '<code>$1</code>', $body );

		return wp_kses(
			(string) nl2br( $body ),
			array(
				'strong' => array(),
				'em'     => array(),
				'code'   => array(),
				'br'     => array(),
			)
		);
	}
}
