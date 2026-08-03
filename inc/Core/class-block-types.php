<?php
/**
 * Block Types
 *
 * Registers every compiled block and block variation the theme ships.
 *
 * Blocks are discovered by scanning the build output rather than listed by
 * hand, so adding a block directory under src/ is all that is needed to
 * register it.
 *
 * @package LAAO
 */

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Discovers and registers the theme's blocks and block variations.
 */
class Block_Types {

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
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

	/**
	 * Registers every block found in a build directory.
	 *
	 * @param string $dir Theme-relative build directory, e.g. '/dist/blocks'.
	 * @return void
	 */
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

	/**
	 * Enqueues the editor script for each discovered block variation.
	 *
	 * @return void
	 */
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

	/**
	 * Maps variation files to the block variation names they declare.
	 *
	 * @param string $directory Absolute path to the built variations directory.
	 * @return array<string, string> Map of file name => variation name.
	 */
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

	/**
	 * Reads the `name` property out of a compiled block variation file.
	 *
	 * @param string $file_path Absolute path to the variation JavaScript file.
	 * @return string|null The variation name, or null if the file declares none.
	 */
	private function extract_variation_name( string $file_path ): ?string {
		// $file_path always comes from a glob of the theme's own dist/block-variations
		// directory, so this is a local read, never a remote fetch. WP_Filesystem would
		// mean initialising the filesystem API on every front-end request to read a
		// handful of bundled files.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsUnknown -- See above.
		$js_content = file_get_contents( $file_path );

		if ( false === $js_content ) {
			return null;
		}

		$pattern = '/\bname\s*:\s*[\'"]([^\'"]+)[\'"]/';

		return preg_match( $pattern, $js_content, $matches ) ? $matches[1] : null;
	}
}
