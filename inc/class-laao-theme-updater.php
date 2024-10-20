<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LAAO_Theme_Updater {

	private $repo_owner = 'TheAggressive';
	private $repo_name  = 'LAAO';

	public function __construct() {
		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ), 100, 1 );
		add_filter( 'upgrader_source_selection', array( $this, 'rename_package' ), 10, 3 );
	}

	// Check for updates by comparing the current version with the GitHub release
	public function check_for_update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$source_version  = $this->get_github_version();
		$theme_slug      = wp_get_theme()->get_stylesheet();
		$current_version = wp_get_theme()->get( 'Version' );

		if ( version_compare( $source_version, $current_version, '>' ) ) {
			$transient->response[ $theme_slug ] = array(
				'theme'       => $theme_slug,
				'new_version' => $source_version,
				'url'         => "https://github.com/{$this->repo_owner}/{$this->repo_name}",
				'package'     => $this->get_download_url(),
			);
		}

		return $transient;
	}

	// Fetch the latest version from GitHub API
	private function get_github_version() {
		$url = "https://api.github.com/repos/{$this->repo_owner}/{$this->repo_name}/releases/latest";

		$args = array(
			'headers' => array(
				'User-Agent' => $this->repo_owner,
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return isset( $body['tag_name'] ) ? ltrim( $body['tag_name'], 'v' ) : false;
	}

	// Get the download URL for the latest GitHub release
	private function get_download_url() {
		$url = "https://api.github.com/repos/{$this->repo_owner}/{$this->repo_name}/releases/latest";

		$args = array(
			'headers' => array(
				'User-Agent' => $this->repo_owner,
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return isset( $body['assets'][0]['browser_download_url'] ) ? $body['assets'][0]['browser_download_url'] : false;
	}

	// Rename the downloaded folder to match the theme directory name
	public function rename_package( $source, $remote_source, $theme ) {
		$theme_slug = wp_get_theme()->get_stylesheet();
		if ( strpos( $remote_source, $this->repo_name ) !== false ) {
			$corrected_source = trailingslashit( $theme ) . $theme_slug;
			rename( $source, $corrected_source );
			return $corrected_source;
		}
		return $source;
	}
}
