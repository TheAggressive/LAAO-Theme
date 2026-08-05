<?php
/**
 * Behavioural tests for the update download and verification flow.
 *
 * The allow-list tests elsewhere prove the updater refuses bad *inputs*. These
 * prove the security control itself works: that a package whose digest does not
 * match is rejected and deleted, that one with no published digest is refused,
 * and that a genuine package is accepted. Without these, checksum verification
 * is asserted only by the fact that the code exists.
 *
 * The HTTP layer is stubbed at wp_safe_remote_get rather than by injecting a
 * fake client, so the real Http_Client and Release_Repository both run —
 * including the allow-list checks the verifier depends on. Digests are computed
 * with hash_file() rather than hard-coded, so a broken comparison cannot pass by
 * agreeing with a fixture.
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
use WP_Error;

/**
 * Download and verification flow test case.
 */
class ThemeUpdateVerificationFlowTest extends TestCase {

	/**
	 * Package URL used across the cases.
	 *
	 * @var string
	 */
	private const PACKAGE = 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip';

	/**
	 * Temporary files created by a test, removed on teardown.
	 *
	 * @var string[]
	 */
	private array $temp_files = array();

	/**
	 * Sets up WordPress function stubs.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// phpcs:disable WordPress.WP.AlternativeFunctions.parse_url_parse_url, WordPress.CodeAnalysis.AssignmentInTernaryCondition.FoundInTernaryCondition -- This stub IS wp_parse_url().
		Functions\when( 'wp_parse_url' )->alias(
			static fn( $url, $component = -1 ) => -1 === $component ? parse_url( $url ) : parse_url( $url, $component )
		);
		// phpcs:enable

		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );
		Functions\when( '__' )->returnArg();
		Functions\when( 'is_wp_error' )->alias( static fn( $t ) => $t instanceof WP_Error );
		// phpcs:disable WordPress.WP.AlternativeFunctions.unlink_unlink -- This stub IS wp_delete_file().
		Functions\when( 'wp_delete_file' )->alias(
			static function ( $file ) {
				if ( is_string( $file ) && file_exists( $file ) ) {
					unlink( $file );
				}
			}
		);
		// phpcs:enable
		Functions\when( 'sanitize_title' )->alias(
			static fn( $t ) => strtolower( str_replace( array( '.', ' ' ), '-', (string) $t ) )
		);
	}

	/**
	 * Removes temporary files and mocks.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink -- Test fixture cleanup; WordPress is not loaded.
				unlink( $file );
			}
		}
		$this->temp_files = array();

		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Writes a temporary file standing in for a downloaded package.
	 *
	 * @param string $contents File contents.
	 * @return string Absolute path.
	 */
	private function make_package_file( string $contents ): string {
		$path = (string) tempnam( sys_get_temp_dir(), 'laao-pkg-' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Unit test fixture; WP_Filesystem is not loaded.
		file_put_contents( $path, $contents );
		$this->temp_files[] = $path;

		return $path;
	}

	/**
	 * Release payload with a package and its checksum sidecar.
	 *
	 * @return array<string, mixed>
	 */
	private function release_with_sidecar(): array {
		return array(
			'tag_name' => 'v1.9.0',
			'assets'   => array(
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
	 * JSON-encodes a fixture.
	 *
	 * WordPress is not loaded in these unit tests, so wp_json_encode is
	 * unavailable.
	 *
	 * @param mixed $data Data to encode.
	 * @return string JSON.
	 */
	private static function encode( $data ): string {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode -- wp_json_encode is unavailable here.
		return (string) json_encode( $data );
	}

	/**
	 * Routes stubbed HTTP responses by URL.
	 *
	 * @param array<int, array<string, mixed>> $releases Releases API payload.
	 * @param string|null                      $sidecar  Sidecar body, or null to fail it.
	 * @return void
	 */
	private function stub_http( array $releases, ?string $sidecar ): void {
		$api_body = self::encode( $releases );

		Functions\when( 'wp_safe_remote_get' )->alias(
			static function ( $url ) use ( $api_body, $sidecar ) {
				if ( str_contains( (string) $url, 'api.github.com' ) ) {
					return array( 'body' => $api_body );
				}

				return null === $sidecar
					? new WP_Error( 'http_request_failed' )
					: array( 'body' => $sidecar );
			}
		);

		Functions\when( 'wp_remote_retrieve_response_code' )->alias(
			static fn( $response ) => is_array( $response ) ? 200 : 0
		);
		Functions\when( 'wp_remote_retrieve_body' )->alias(
			static fn( $response ) => is_array( $response ) ? (string) ( $response['body'] ?? '' ) : ''
		);
	}

	/**
	 * Builds a verifier over the real repository.
	 *
	 * @return Theme_Update_Package_Verifier
	 */
	private function make_verifier(): Theme_Update_Package_Verifier {
		$http     = new Theme_Update_Http_Client();
		$releases = new Theme_Update_Release_Repository( $http, 'TheAggressive', 'LAAO-Theme' );

		return new Theme_Update_Package_Verifier( $releases, $http );
	}

	/**
	 * Accepts a package whose digest matches the published checksum.
	 *
	 * @return void
	 */
	public function test_accepts_a_package_matching_its_published_checksum(): void {
		$file   = $this->make_package_file( 'genuine theme archive' );
		$digest = (string) hash_file( 'sha256', $file );

		$this->stub_http( array( $this->release_with_sidecar() ), "{$digest}  laao-1.9.0.zip\n" );
		Functions\when( 'download_url' )->justReturn( $file );

		$result = $this->make_verifier()->verify_download( false, self::PACKAGE );

		$this->assertSame( $file, $result, 'A genuine package should be returned for installation.' );
		$this->assertFileExists( $file, 'A verified package must not be deleted.' );
	}

	/**
	 * Rejects and deletes a package whose digest does not match.
	 *
	 * This is the assertion the whole feature exists for: without it, checksum
	 * verification is only asserted by the code being present.
	 *
	 * @return void
	 */
	public function test_rejects_and_deletes_a_tampered_package(): void {
		$file  = $this->make_package_file( 'tampered theme archive' );
		$wrong = hash( 'sha256', 'the archive we expected' );

		$this->assertNotSame( $wrong, hash_file( 'sha256', $file ) );

		$this->stub_http( array( $this->release_with_sidecar() ), "{$wrong}  laao-1.9.0.zip\n" );
		Functions\when( 'download_url' )->justReturn( $file );

		$result = $this->make_verifier()->verify_download( false, self::PACKAGE );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'laao_package_checksum_mismatch', $result->get_error_code() );
		$this->assertFileDoesNotExist( $file, 'A rejected package must not be left on disk.' );
	}

	/**
	 * Refuses a package whose release publishes no checksum.
	 *
	 * @return void
	 */
	public function test_refuses_a_package_with_no_published_checksum(): void {
		$this->stub_http(
			array(
				array(
					'tag_name' => 'v1.9.0',
					'assets'   => array(
						array(
							'name'                 => 'laao-1.9.0.zip',
							'browser_download_url' => self::PACKAGE,
						),
					),
				),
			),
			null
		);

		$result = $this->make_verifier()->verify_download( false, self::PACKAGE );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'laao_missing_package_checksum', $result->get_error_code() );
	}

	/**
	 * Refuses when the sidecar cannot be fetched.
	 *
	 * @return void
	 */
	public function test_refuses_when_the_sidecar_request_fails(): void {
		$this->stub_http( array( $this->release_with_sidecar() ), null );

		$result = $this->make_verifier()->verify_download( false, self::PACKAGE );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'laao_missing_package_checksum', $result->get_error_code() );
	}

	/**
	 * Parses a digest out of standard sha256sum output.
	 *
	 * The real sidecar is "<digest>  <filename>", so the parser must not assume
	 * the body is the digest alone.
	 *
	 * @return void
	 */
	public function test_parses_the_digest_from_sha256sum_output(): void {
		$digest = hash( 'sha256', 'anything' );

		$this->stub_http( array( $this->release_with_sidecar() ), "{$digest}  laao-1.9.0.zip\n" );

		$this->assertSame(
			$digest,
			$this->make_verifier()->get_checksum( self::PACKAGE, $this->release_with_sidecar() )
		);
	}

	/**
	 * Ignores a sidecar body containing no valid digest.
	 *
	 * @return void
	 */
	public function test_ignores_a_sidecar_without_a_valid_digest(): void {
		$this->stub_http( array( $this->release_with_sidecar() ), "404: Not Found\n" );

		$this->assertFalse(
			$this->make_verifier()->get_checksum( self::PACKAGE, $this->release_with_sidecar() )
		);
	}

	/**
	 * Picks the highest stable release, skipping drafts and prereleases.
	 *
	 * @return void
	 */
	public function test_selects_the_highest_stable_release(): void {
		$this->stub_http(
			array(
				array( 'tag_name' => 'v1.8.0' ),
				array(
					'tag_name' => 'v2.0.0',
					'draft'    => true,
				),
				array(
					'tag_name'   => 'v1.9.5',
					'prerelease' => true,
				),
				array( 'tag_name' => 'v1.9.0' ),
				array( 'tag_name' => 'not-a-version' ),
			),
			null
		);

		$http     = new Theme_Update_Http_Client();
		$releases = new Theme_Update_Release_Repository( $http, 'TheAggressive', 'LAAO-Theme' );

		$this->assertSame( '1.9.0', $releases->get_version() );
	}

	/**
	 * Falls back to cached release data when GitHub is unreachable.
	 *
	 * A GitHub outage must not withdraw an update the site already knows about.
	 *
	 * @return void
	 */
	public function test_falls_back_to_cached_release_when_github_is_unreachable(): void {
		Functions\when( 'get_transient' )->justReturn(
			array(
				'release_data' => array( 'tag_name' => 'v1.9.0' ),
				// Old enough that the cache is stale and a refresh is attempted.
				'checked_at'   => time() - 3600,
			)
		);

		Functions\when( 'wp_safe_remote_get' )->justReturn( new WP_Error( 'http_request_failed' ) );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 0 );
		Functions\when( 'wp_remote_retrieve_body' )->justReturn( '' );

		$http     = new Theme_Update_Http_Client();
		$releases = new Theme_Update_Release_Repository( $http, 'TheAggressive', 'LAAO-Theme' );

		$this->assertSame( '1.9.0', $releases->get_version() );
	}
}
