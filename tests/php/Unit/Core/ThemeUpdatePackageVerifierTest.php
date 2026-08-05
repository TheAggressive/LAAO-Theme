<?php
/**
 * Unit tests for LAAO\Core\Theme_Update_Package_Verifier.
 *
 * The verifier is the last thing standing between a tampered download and code
 * being unpacked over the live theme, so the cases that matter most are the
 * refusals: a mismatched digest, a missing sidecar, and a checksum URL that
 * does not belong to the release.
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Core\Theme_Update_Http_Client;
use LAAO\Core\Theme_Update_Package_Verifier;
use LAAO\Core\Theme_Update_Release_Repository;
use PHPUnit\Framework\TestCase;

/**
 * Package verifier test case.
 */
class ThemeUpdatePackageVerifierTest extends TestCase {

	/**
	 * A valid-looking SHA-256 digest.
	 *
	 * @var string
	 */
	private const DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

	/**
	 * Package URL used across the cases.
	 *
	 * @var string
	 */
	private const PACKAGE = 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip';

	/**
	 * Sets up WordPress function stubs.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// phpcs:disable WordPress.WP.AlternativeFunctions.parse_url_parse_url, WordPress.CodeAnalysis.AssignmentInTernaryCondition.FoundInTernaryCondition -- This stub IS wp_parse_url(), so it has to call the native function; the
		// ternary flag is a false positive on the default parameter value.
		Functions\when( 'wp_parse_url' )->alias(
			static fn( $url, $component = -1 ) => -1 === $component ? parse_url( $url ) : parse_url( $url, $component )
		);
		// phpcs:enable
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( '__' )->returnArg();
	}

	/**
	 * Tears down mocks.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Builds a verifier over a real repository instance.
	 *
	 * @return Theme_Update_Package_Verifier
	 */
	private function make_verifier(): Theme_Update_Package_Verifier {
		$http     = new Theme_Update_Http_Client();
		$releases = new Theme_Update_Release_Repository( $http, 'TheAggressive', 'LAAO-Theme' );

		return new Theme_Update_Package_Verifier( $releases, $http );
	}

	/**
	 * Release payload carrying a package and its checksum sidecar.
	 *
	 * @return array<string, mixed>
	 */
	private function release_with_sidecar(): array {
		return array(
			'assets' => array(
				array(
					'name'                 => 'laao-1.9.0.zip',
					'browser_download_url' => self::PACKAGE,
				),
				array(
					'name'                 => 'laao-1.9.0.zip.sha256',
					'browser_download_url' => self::PACKAGE . '.sha256',
				),
			),
		);
	}

	/**
	 * Finds the sidecar that belongs to the package.
	 *
	 * @return void
	 */
	public function test_finds_the_checksum_sidecar_for_a_package(): void {
		$this->assertSame(
			self::PACKAGE . '.sha256',
			$this->make_verifier()->get_checksum_asset_url( self::PACKAGE, $this->release_with_sidecar() )
		);
	}

	/**
	 * Returns false when the release publishes no sidecar.
	 *
	 * @return void
	 */
	public function test_returns_false_when_no_sidecar_is_published(): void {
		$this->assertFalse(
			$this->make_verifier()->get_checksum_asset_url(
				self::PACKAGE,
				array(
					'assets' => array(
						array(
							'name'                 => 'laao-1.9.0.zip',
							'browser_download_url' => self::PACKAGE,
						),
					),
				)
			)
		);
	}

	/**
	 * Refuses a sidecar hosted somewhere untrusted.
	 *
	 * Without this, a release whose asset list had been tampered with could
	 * point the verifier at an attacker-controlled digest, which would then
	 * "verify" an attacker-controlled package.
	 *
	 * @return void
	 */
	public function test_refuses_a_sidecar_on_an_untrusted_host(): void {
		$this->assertFalse(
			$this->make_verifier()->get_checksum_asset_url(
				self::PACKAGE,
				array(
					'assets' => array(
						array(
							'name'                 => 'laao-1.9.0.zip',
							'browser_download_url' => self::PACKAGE,
						),
						array(
							'name'                 => 'laao-1.9.0.zip.sha256',
							'browser_download_url' => 'https://evil.example/laao-1.9.0.zip.sha256',
						),
					),
				)
			)
		);
	}

	/**
	 * Uses a cached checksum only when it belongs to this exact package.
	 *
	 * @return void
	 */
	public function test_uses_cached_checksum_for_the_matching_package(): void {
		Functions\when( 'get_transient' )->justReturn(
			array(
				'download_url' => self::PACKAGE,
				'checksum'     => self::DIGEST,
			)
		);

		$this->assertSame( self::DIGEST, $this->make_verifier()->get_checksum( self::PACKAGE ) );
	}

	/**
	 * Ignores a cached checksum recorded against a different package.
	 *
	 * @return void
	 */
	public function test_ignores_cached_checksum_for_a_different_package(): void {
		Functions\when( 'get_transient' )->justReturn(
			array(
				'download_url' => 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.0.0/laao-1.0.0.zip',
				'checksum'     => self::DIGEST,
			)
		);

		// No release data and no matching cache entry, so nothing to resolve.
		$this->assertFalse( $this->make_verifier()->get_checksum( self::PACKAGE, array() ) );
	}

	/**
	 * Ignores a cached value that is not a well-formed digest.
	 *
	 * @return void
	 */
	public function test_ignores_a_malformed_cached_checksum(): void {
		Functions\when( 'get_transient' )->justReturn(
			array(
				'download_url' => self::PACKAGE,
				'checksum'     => 'not-a-sha256',
			)
		);

		$this->assertFalse( $this->make_verifier()->get_checksum( self::PACKAGE, array() ) );
	}

	/**
	 * Passes an unrelated package through untouched.
	 *
	 * Other plugins and themes update through the same filter, so anything that
	 * is not ours must come back exactly as it arrived.
	 *
	 * @return void
	 */
	public function test_ignores_packages_from_other_sources(): void {
		$this->assertFalse(
			$this->make_verifier()->verify_download( false, 'https://example.com/some-other-plugin.zip' )
		);
	}

	/**
	 * Leaves an earlier filter's result alone.
	 *
	 * @return void
	 */
	public function test_defers_to_an_earlier_filter_result(): void {
		$this->assertSame(
			'/tmp/already-downloaded.zip',
			$this->make_verifier()->verify_download( '/tmp/already-downloaded.zip', self::PACKAGE )
		);
	}
}
