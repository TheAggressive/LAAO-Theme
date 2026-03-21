<?php

declare(strict_types=1);

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Theme_Updates {

	private string $repo_owner = 'TheAggressive';
	private string $repo_name  = 'LAAO-Theme';

	public function init(): void {
		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ), 100, 1 );
		add_filter( 'upgrader_source_selection', array( $this, 'rename_package' ), 10, 3 );
		add_filter( 'themes_api', array( $this, 'themes_api' ), 10, 3 );
		add_action( 'admin_notices', array( $this, 'admin_update_notice' ) );
		add_action( 'load-update-core.php', array( $this, 'force_fresh_check' ) );
	}

	public function force_fresh_check(): void {
		delete_transient( 'laao_theme_update' );
		delete_transient( 'laao_theme_update_release' );
		wp_update_themes();
	}

	public function check_for_update( mixed $transient ): mixed {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$theme           = wp_get_theme();
		$theme_slug      = $theme->get_stylesheet();
		$current_version = $theme->get( 'Version' );
		$source_version  = $this->get_github_version();

		if ( ! $source_version || ! is_string( $source_version ) ) {
			return $transient;
		}

		if ( version_compare( $source_version, $current_version, '>' ) ) {
			$download_url = $this->get_download_url();

			if ( ! $download_url || ! is_string( $download_url ) ) {
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

	private function get_download_url(): string|false {
		$cached_data = get_transient( 'laao_theme_update' );
		if ( $cached_data && isset( $cached_data['download_url'] ) ) {
			return $cached_data['download_url'];
		}

		$release_data = $this->get_github_release_data();

		if ( ! $release_data ) {
			return $this->get_fallback_download_url();
		}

		if ( isset( $release_data['assets'][0]['browser_download_url'] ) ) {
			return $release_data['assets'][0]['browser_download_url'];
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

	private function get_fallback_download_url(): string|false {
		$cached_data = get_transient( 'laao_theme_update' );
		if ( $cached_data && isset( $cached_data['version'] ) ) {
			$tag = ltrim( $cached_data['version'], 'v' );
			return "https://github.com/{$this->repo_owner}/{$this->repo_name}/releases/download/v{$tag}/laao-{$tag}.zip";
		}

		return false;
	}

	// Fetch releases list, skip drafts and prereleases, return the highest stable semver.
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

	public function rename_package( string $source, string $remote_source, mixed $_upgrader ): string {
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

		return (object) array(
			'name'           => $theme->get( 'Name' ),
			'slug'           => $theme_slug,
			'version'        => ltrim( $release_data['tag_name'], 'v' ),
			'author'         => $theme->get( 'Author' ),
			'author_profile' => $theme->get( 'AuthorURI' ),
			'requires'       => $theme->get( 'RequiresWP' ) ?: '6.8',
			'tested'         => (string) ( $theme->get( 'TestedUpTo' ) ?: '6.8' ),
			'requires_php'   => $theme->get( 'RequiresPHP' ) ?: '8.0',
			'rating'         => 100,
			'num_ratings'    => 1,
			'ratings'        => array( 5 => 1 ),
			'downloaded'     => 0,
			'last_updated'   => $release_data['published_at'],
			'homepage'       => $theme->get( 'ThemeURI' ) ?: $release_data['html_url'],
			'sections'       => array(
				'description' => $theme->get( 'Description' ),
				'changelog'   => $this->format_changelog( $release_data ),
			),
			'download_link'  => $download_link ?: ( $release_data['zipball_url'] ?? '' ),
			'tags'           => array(),
			'screenshots'    => array(),
		);
	}

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
