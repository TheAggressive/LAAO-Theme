<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class LAAO_Theme_Updater {
	private $github_repo;
	private $github_access_token;
	private $theme_slug;
	private $github_api_url;
	private $current_version;

	public function __construct() {
		$this->github_repo         = 'TheAggressive/LAAO-Theme';
		$this->github_access_token = $token;
		$this->theme_slug          = wp_get_theme()->get( 'TextDomain' );
		$this->current_version     = wp_get_theme()->get( 'Version' );
		$this->github_api_url      = "https://api.github.com/repos/{$this->github_repo}/releases/latest";

		add_filter( 'pre_set_site_transient_update_themes', array( $this, 'check_for_update' ) );
		add_filter( 'upgrader_source_selection', array( $this, 'fix_source_path' ), 10, 3 );
	}

	// Check for updates by comparing current version with the GitHub release version
	public function check_for_update( $transient ) {
		$remote = $this->get_latest_release();
		if ( ! $remote ) {
			return $transient;
		}

		if ( version_compare( $this->current_version, $remote->tag_name, '<' ) ) {
			$transient->response[ $this->theme_slug ] = array(
				'theme'       => $this->theme_slug,
				'new_version' => $remote->tag_name,
				'url'         => $remote->html_url,
				'package'     => $remote->zipball_url . '?access_token=' . $this->github_access_token,
			);
		}

		return $transient;
	}

	// Retrieve the latest release from the GitHub API
	private function get_latest_release() {
		$response = wp_remote_get(
			$this->github_api_url,
			array(
				'headers' => array(
					'Authorization' => 'token ' . $this->github_access_token,
					'User-Agent'    => 'WordPress Theme Updater',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body );
	}

	// Fix the source path when extracting the theme
	public function fix_source_path( $source, $remote_source, $upgrader ) {
		if ( strpos( $source, $this->github_repo ) !== false ) {
			$corrected_source = trailingslashit( $remote_source ) . $this->theme_slug;
			rename( $source, $corrected_source );
			return $corrected_source;
		}
		return $source;
	}
}

// Usage Example:
$theme_updater = new LAAO_Theme_Updater(
	'username/repo-name',       // GitHub repository in the format 'username/repo'
	'your-personal-access-token', // GitHub personal access token
	'theme-slug',               // Theme slug (directory name)
	'1.0.0'                     // Current theme version
);
