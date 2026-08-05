<?php
/**
 * Theme Updates
 *
 * Serves theme updates from GitHub releases so the site can update itself
 * without the WordPress.org directory.
 *
 * This class is a coordinator. Fetching and validating release metadata lives
 * in Theme_Update_Release_Repository, checksum verification in
 * Theme_Update_Package_Verifier, and bounded HTTP in
 * Theme_Update_Http_Client — a split worth having because the updater hands a
 * URL to WordPress that will be downloaded and unpacked over the live theme,
 * and each of those responsibilities is separately testable.
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
	 * Cached update metadata key.
	 *
	 * @var string
	 */
	private const UPDATE_CACHE_KEY = 'laao_theme_update';

	/**
	 * Release metadata source.
	 *
	 * @var Theme_Update_Release_Repository
	 */
	private Theme_Update_Release_Repository $releases;

	/**
	 * Package checksum verifier.
	 *
	 * @var Theme_Update_Package_Verifier
	 */
	private Theme_Update_Package_Verifier $packages;

	/**
	 * Constructor.
	 *
	 * Collaborators are optional so the container can construct this with no
	 * arguments, while tests can inject doubles.
	 *
	 * @param Theme_Update_Release_Repository|null $releases Release repository.
	 * @param Theme_Update_Package_Verifier|null   $packages Package verifier.
	 */
	public function __construct(
		?Theme_Update_Release_Repository $releases = null,
		?Theme_Update_Package_Verifier $packages = null
	) {
		$http           = new Theme_Update_Http_Client();
		$this->releases = $releases ?? new Theme_Update_Release_Repository( $http );
		$this->packages = $packages ?? new Theme_Update_Package_Verifier( $this->releases, $http );
	}

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ), 100, 1 );
		add_filter( 'upgrader_pre_download', array( $this, 'verify_package_download' ), 10, 2 );
		add_filter( 'upgrader_source_selection', array( $this, 'rename_package' ), 10, 2 );
		add_filter( 'themes_api', array( $this, 'themes_api' ), 10, 3 );
		add_action( 'admin_notices', array( $this, 'admin_update_notice' ) );
		add_action( 'load-update-core.php', array( $this, 'force_fresh_check' ) );
	}

	/**
	 * Drops cached release data so the next check hits GitHub.
	 *
	 * @return void
	 */
	public function force_fresh_check(): void {
		delete_transient( self::UPDATE_CACHE_KEY );
		delete_transient( 'laao_theme_update_release' );
		wp_update_themes();
	}

	/**
	 * Advertises a newer GitHub release through the update transient.
	 *
	 * An update is only offered when its checksum can be resolved. Refusing to
	 * advertise an unverifiable update is deliberate: the alternative is
	 * offering one that verify_package_download() will then reject at install
	 * time, which reads to the user as a broken updater rather than a refused
	 * package.
	 *
	 * @param mixed $transient The update_themes site transient.
	 * @return mixed The transient, with this theme's update added when one exists.
	 */
	public function check_for_update( mixed $transient ): mixed {
		// Core seeds this transient as a stdClass. Anything else came from a
		// third party mangling the filter chain — hand it back untouched rather
		// than writing properties onto an unknown object.
		if ( ! $transient instanceof \stdClass || empty( $transient->checked ) ) {
			return $transient;
		}

		$theme           = wp_get_theme();
		$theme_slug      = $theme->get_stylesheet();
		$current_version = $theme->get( 'Version' );
		$source_version  = $this->releases->get_version();

		if ( ! $source_version ) {
			return $transient;
		}

		if ( ! version_compare( $source_version, (string) $current_version, '>' ) ) {
			return $transient;
		}

		$download_url = $this->releases->get_download_url();

		if ( ! $download_url || ! $this->releases->is_allowed_package_url( $download_url ) ) {
			return $transient;
		}

		$release_data = $this->releases->get_release_data();
		$checksum     = $this->packages->get_checksum(
			$download_url,
			is_array( $release_data ) ? $release_data : null
		);

		if ( ! $checksum ) {
			return $transient;
		}

		if ( ! isset( $transient->response ) ) {
			$transient->response = array();
		}

		$transient->response[ $theme_slug ] = array(
			'theme'       => $theme_slug,
			'new_version' => $source_version,
			'url'         => $this->releases->get_repository_url(),
			'package'     => $download_url,
			'checksum'    => Theme_Update_Package_Verifier::CHECKSUM_ALGORITHM . ':' . $checksum,
		);

		if ( $release_data ) {
			set_transient(
				self::UPDATE_CACHE_KEY,
				array(
					'version'      => $source_version,
					'download_url' => $download_url,
					'checksum'     => $checksum,
					'release_data' => $release_data,
					'checked_at'   => time(),
				),
				HOUR_IN_SECONDS
			);
		}

		return $transient;
	}

	/**
	 * Verifies the package against its published checksum before installation.
	 *
	 * @param false|\WP_Error|string $reply   Result from an earlier filter.
	 * @param mixed                  $package Package URL being downloaded.
	 * @return false|\WP_Error|string Verified file path, the original reply, or an error.
	 */
	public function verify_package_download( $reply, $package ) {
		return $this->packages->verify_download( $reply, $package );
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
		if ( ! $this->releases->is_repository_source( $remote_source ) ) {
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

		$release_data = $this->releases->get_release_data();

		if ( ! $release_data ) {
			return $result;
		}

		$download_link = $this->releases->get_download_url();

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
