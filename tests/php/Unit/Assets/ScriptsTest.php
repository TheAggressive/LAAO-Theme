<?php
/**
 * Unit tests for LAAO\Assets\Scripts.
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Assets\Scripts;
use PHPUnit\Framework\TestCase;

class ScriptsTest extends TestCase {

	/**
	 * Subject under test.
	 *
	 * @var Scripts
	 */
	private Scripts $scripts;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\when( 'is_admin' )->justReturn( false );

		$this->scripts = new Scripts(
			array( 'arts', 'theatre' ),
			array( 'cover' ),
			array( 'wh_cover' )
		);
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// -------------------------------------------------------------------------
	// Whitelisted scripts — must NOT receive defer
	// -------------------------------------------------------------------------

	#[\PHPUnit\Framework\Attributes\DataProvider( 'whitelisted_scripts' )]
	public function test_whitelisted_scripts_are_not_deferred( string $handle ): void {
		$tag = '<script id="' . $handle . '" src="/path/to/' . $handle . '"></script>';
		$this->assertStringNotContainsString( 'defer', $this->scripts->defer( $tag ) );
	}

	public static function whitelisted_scripts(): array {
		return array(
			'jquery.min.js'    => array( 'jquery.min.js' ),
			'jquery.js'        => array( 'jquery.js' ),
			'i18n.min.js'      => array( 'i18n.min.js' ),
			'a11y.min.js'      => array( 'a11y.min.js' ),
			'dom-ready.min.js' => array( 'dom-ready.min.js' ),
			'wp-polyfill.js'   => array( 'wp-polyfill.js' ),
			'hooks.min.js'     => array( 'hooks.min.js' ),
			'wp-embed.min.js'  => array( 'wp-embed.min.js' ),
			'index.js'         => array( 'index.js' ),    // phpcs:ignore WordPress.WP.EnqueuedResources
		);
	}

	// -------------------------------------------------------------------------
	// Unknown scripts — must receive defer
	// -------------------------------------------------------------------------

	#[\PHPUnit\Framework\Attributes\DataProvider( 'deferrable_scripts' )]
	public function test_unknown_js_scripts_receive_defer( string $src ): void {
		$tag = '<script src="' . $src . '"></script>';
		$this->assertStringContainsString( 'defer', $this->scripts->defer( $tag ) );
	}

	public static function deferrable_scripts(): array {
		return array(
			'local gsap bundle'  => array( '/dist/scripts/gsap.js' ),
			'local smoothscroll' => array( '/dist/scripts/smoothscroll.js' ),
			'local app bundle'   => array( '/dist/scripts/app.js' ),
			'cdn gsap'           => array( 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js' ),
			'cdn lenis'          => array( 'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js' ),
		);
	}

	// -------------------------------------------------------------------------
	// Edge cases
	// -------------------------------------------------------------------------

	public function test_non_js_tags_are_not_modified(): void {
		$tag = '<link rel="stylesheet" href="/dist/styles/app.css">';
		$this->assertSame( $tag, $this->scripts->defer( $tag ) );
	}

	public function test_already_deferred_script_does_not_get_double_defer(): void {
		$tag    = '<script defer src="/dist/scripts/gsap.js"></script>';
		$result = $this->scripts->defer( $tag );
		$this->assertSame( 1, substr_count( $result, 'defer' ) );
	}

	public function test_admin_scripts_are_never_deferred(): void {
		Functions\when( 'is_admin' )->justReturn( true );
		$tag = '<script src="/dist/scripts/gsap.js"></script>';
		$this->assertStringNotContainsString( 'defer', $this->scripts->defer( $tag ) );
	}

	public function test_whitelist_match_at_position_zero_is_handled(): void {
		// Regression: strpos returning 0 (falsy) would have allowed deferring a
		// whitelisted script if the tag string somehow started with the filename.
		// This verifies the !== false fix is in place.
		$tag = 'jquery.min.js src="/fake"';
		$this->assertStringNotContainsString( 'defer', $this->scripts->defer( $tag ) );
	}

	// -------------------------------------------------------------------------
	// Editor sidebar plugin registration
	// -------------------------------------------------------------------------

	/**
	 * Registers the sidebar plugins against a fixture theme directory.
	 *
	 * Builds dist/scripts/*.asset.php under a temp root rather than reading the
	 * real dist/, so the assertions hold whether or not a build has run — the
	 * PHP lane in CI does not build.
	 *
	 * @param array<string, string> $manifests Bundle basename => manifest PHP source.
	 * @return array{registered: array<string, array{deps: string[], version: string}>, translated: string[]}
	 */
	private function register_with_manifests( array $manifests ): array {
		$root = sys_get_temp_dir() . '/laao-scripts-' . uniqid( '', true );
		mkdir( $root . '/dist/scripts', 0777, true );

		foreach ( $manifests as $file => $source ) {
			file_put_contents( $root . '/dist/scripts/' . $file . '.asset.php', $source );
		}

		$registered = array();
		$translated = array();

		Functions\when( 'get_template_directory' )->justReturn( $root );
		Functions\when( 'get_template_directory_uri' )->justReturn( 'https://example.test/theme' );
		Functions\when( 'wp_get_theme' )->justReturn(
			new class() {
				/**
				 * Stands in for WP_Theme::get().
				 *
				 * @param string $key Header key.
				 * @return string
				 */
				public function get( string $key ): string {
					return 'Version' === $key ? '9.9.9' : '';
				}
			}
		);

		Functions\when( 'wp_register_script' )->alias(
			function ( $handle, $src, $deps, $version ) use ( &$registered ) {
				$registered[ $handle ] = array(
					'deps'    => $deps,
					'version' => $version,
				);
				return true;
			}
		);

		Functions\when( 'wp_set_script_translations' )->alias(
			function ( $handle ) use ( &$translated ) {
				$translated[] = $handle;
				return true;
			}
		);

		$this->scripts->register_block_plugins();

		$fixtures = glob( $root . '/dist/scripts/*' );
		if ( is_array( $fixtures ) ) {
			array_map( 'unlink', $fixtures );
		}
		rmdir( $root . '/dist/scripts' );
		rmdir( $root . '/dist' );
		rmdir( $root );

		return array(
			'registered' => $registered,
			'translated' => $translated,
		);
	}

	public function test_dependencies_and_version_come_from_the_asset_manifest(): void {
		// The hardcoded list this replaced was wp-plugins, wp-editor, react —
		// which omitted wp-i18n, so every __() in these panels was untranslatable
		// even once a catalog existed.
		$result = $this->register_with_manifests(
			array(
				'editorial-block-plugin' => "<?php return array('dependencies' => array('wp-i18n', 'wp-components'), 'version' => 'abc123');",
			)
		);

		$this->assertSame(
			array( 'wp-i18n', 'wp-components' ),
			$result['registered']['editorial-block-plugin']['deps']
		);
		$this->assertSame( 'abc123', $result['registered']['editorial-block-plugin']['version'] );
	}

	public function test_every_sidebar_plugin_receives_script_translations(): void {
		$result = $this->register_with_manifests( array() );

		$this->assertCount(
			8,
			$result['translated'],
			'Each registered sidebar panel must get wp_set_script_translations().'
		);
		$this->assertSame(
			array_keys( $result['registered'] ),
			$result['translated'],
			'Translations must be set for exactly the handles that were registered.'
		);
	}

	public function test_missing_manifest_falls_back_to_the_theme_version(): void {
		$result = $this->register_with_manifests( array() );

		$this->assertSame( '9.9.9', $result['registered']['cover-block-plugin']['version'] );
		$this->assertSame( array(), $result['registered']['cover-block-plugin']['deps'] );
	}

	public function test_malformed_manifest_does_not_fatal(): void {
		// A manifest returning a scalar is what a truncated write looks like.
		// Registering with no dependencies is recoverable and visible in the
		// console; a TypeError during init takes the whole editor down.
		$result = $this->register_with_manifests(
			array(
				'highlight-block-plugin' => '<?php return "not an array";',
			)
		);

		$this->assertSame( '9.9.9', $result['registered']['highlight-block-plugin']['version'] );
		$this->assertSame( array(), $result['registered']['highlight-block-plugin']['deps'] );
	}
}
