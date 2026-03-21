<?php

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Block_Types {

	public function init(): void {
		add_action(
			'init',
			function () {
				$this->register_blocks( '/dist/blocks' );
				$this->register_blocks( '/dist/blocks-interactivity' );
			}
		);

		add_action( 'enqueue_block_editor_assets', array( $this, 'register_block_variations' ) );
	}

	public function register_blocks( string $dir ): void {
		$build_dir = get_stylesheet_directory() . $dir;

		if ( ! is_dir( $build_dir ) ) {
			return;
		}

		foreach ( scandir( $build_dir ) as $result ) {
			$block_location = $build_dir . '/' . $result;

			if ( ! is_dir( $block_location ) || '.' === $result || '..' === $result ) {
				continue;
			}

			register_block_type( $block_location );
		}
	}

	public function register_block_variations(): void {
		$variations = $this->get_block_variations( get_stylesheet_directory() . '/dist/block-variations' );

		foreach ( $variations as $file => $name ) {
			wp_enqueue_script(
				$name . '-variation',
				get_template_directory_uri() . '/dist/block-variations/' . $file,
				array( 'wp-blocks', 'wp-dom-ready' ),
				wp_get_theme()->get( 'Version' ),
				false
			);
		}
	}

	private function get_block_variations( string $directory ): array {
		if ( ! is_dir( $directory ) ) {
			return array();
		}

		$files = glob( $directory . '/*.js' );

		if ( empty( $files ) ) {
			return array();
		}

		$results = array();

		foreach ( $files as $file ) {
			$name = $this->extract_variation_name( $file );

			if ( null !== $name ) {
				$results[ basename( $file ) ] = $name;
			}
		}

		return $results;
	}

	private function extract_variation_name( string $file_path ): ?string {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$js_content = file_get_contents( $file_path );

		if ( false === $js_content ) {
			return null;
		}

		$pattern = '/\bname\s*:\s*[\'"]([^\'"]+)[\'"]/';

		return preg_match( $pattern, $js_content, $matches ) ? $matches[1] : null;
	}
}
