<?php

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Theme_Updates {

	private string $repo_owner = 'TheAggressive';
	private string $repo_name  = 'LAAO';

	public function init(): void {
		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ), 100, 1 );
		add_filter( 'upgrader_source_selection', array( $this, 'rename_package' ), 10, 3 );
	}

	public function check_for_update( mixed $transient ): mixed {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$release         = $this->get_latest_release();
		$theme_slug      = wp_get_theme()->get_stylesheet();
		$current_version = wp_get_theme()->get( 'Version' );

		if ( ! $release ) {
			return $transient;
		}

		$source_version = isset( $release['tag_name'] ) ? ltrim( $release['tag_name'], 'v' ) : false;
		$download_url   = isset( $release['assets'][0]['browser_download_url'] ) ? $release['assets'][0]['browser_download_url'] : false;

		if ( $source_version && $download_url && version_compare( $source_version, $current_version, '>' ) ) {
			$transient->response[ $theme_slug ] = array(
				'theme'       => $theme_slug,
				'new_version' => $source_version,
				'url'         => "https://github.com/{$this->repo_owner}/{$this->repo_name}",
				'package'     => $download_url,
			);
		}

		return $transient;
	}

	// Fetch the latest release from GitHub API — single request per update check.
	private function get_latest_release(): array|false {
		$url  = "https://api.github.com/repos/{$this->repo_owner}/{$this->repo_name}/releases/latest";
		$args = array(
			'timeout' => 10,
			'headers' => array(
				'User-Agent' => $this->repo_owner,
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return is_array( $body ) ? $body : false;
	}

	public function rename_package( string $source, string $remote_source, mixed $theme ): string {
		$theme_slug = wp_get_theme()->get_stylesheet();

		if ( strpos( $remote_source, $this->repo_name ) !== false ) {
			$corrected_source = trailingslashit( $theme ) . $theme_slug;
			rename( $source, $corrected_source );
			return $corrected_source;
		}

		return $source;
	}
}
