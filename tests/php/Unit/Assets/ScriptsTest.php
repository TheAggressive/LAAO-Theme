<?php

namespace LAAO\Tests\Unit\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Assets\Scripts;
use PHPUnit\Framework\TestCase;

class ScriptsTest extends TestCase {

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
}
