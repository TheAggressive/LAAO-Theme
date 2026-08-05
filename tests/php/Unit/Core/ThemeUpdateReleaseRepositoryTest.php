<?php
/**
 * Unit tests for LAAO\Core\Theme_Update_Release_Repository.
 *
 * The URL allow-list is the security boundary of the whole updater: whatever it
 * returns is handed to WordPress, downloaded, and unpacked over the live theme.
 * Most of these cases are therefore rejections — the failure that matters is
 * accepting a URL that should have been refused, not refusing a valid one.
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit\Core;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Core\Theme_Update_Http_Client;
use LAAO\Core\Theme_Update_Release_Repository;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Release repository test case.
 */
class ThemeUpdateReleaseRepositoryTest extends TestCase {

	/**
	 * Subject under test.
	 *
	 * @var Theme_Update_Release_Repository
	 */
	private Theme_Update_Release_Repository $releases;

	/**
	 * Sets up WordPress function stubs.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// The real wp_parse_url delegates to parse_url with WP-specific
		// handling for scheme-relative URLs, which none of these cases use.
		// phpcs:disable WordPress.WP.AlternativeFunctions.parse_url_parse_url, WordPress.CodeAnalysis.AssignmentInTernaryCondition.FoundInTernaryCondition -- This stub IS wp_parse_url(), so it has to call the native function; the
		// ternary flag is a false positive on the default parameter value.
		Functions\when( 'wp_parse_url' )->alias(
			static fn( $url, $component = -1 ) => -1 === $component
				? parse_url( $url )
				: parse_url( $url, $component )
		);
		// phpcs:enable

		$this->releases = new Theme_Update_Release_Repository(
			new Theme_Update_Http_Client(),
			'TheAggressive',
			'LAAO-Theme'
		);
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
	 * URLs that are legitimate release packages.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function allowed_package_urls(): array {
		return array(
			'release asset'   => array( 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip' ),
			'api zipball'     => array( 'https://api.github.com/repos/TheAggressive/LAAO-Theme/zipball/v1.9.0' ),
			'mixed case host' => array( 'https://GitHub.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip' ),
		);
	}

	/**
	 * Accepts genuine package URLs.
	 *
	 * @param string $url Candidate URL.
	 * @return void
	 */
	#[DataProvider( 'allowed_package_urls' )]
	public function test_allows_genuine_package_urls( string $url ): void {
		$this->assertTrue( $this->releases->is_allowed_package_url( $url ) );
	}

	/**
	 * URLs that must never be treated as an update package.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function rejected_package_urls(): array {
		return array(
			'plain http'              => array( 'http://github.com/TheAggressive/LAAO-Theme/releases/download/v1/laao-1.zip' ),
			'attacker host'           => array( 'https://evil.example/TheAggressive/LAAO-Theme/releases/download/v1/laao-1.zip' ),
			'credentials before host' => array( 'https://github.com@evil.example/TheAggressive/LAAO-Theme/releases/download/v1/laao-1.zip' ),
			'non-standard port'       => array( 'https://github.com:8443/TheAggressive/LAAO-Theme/releases/download/v1/laao-1.zip' ),
			'path traversal'          => array( 'https://github.com/TheAggressive/LAAO-Theme/releases/download/../../../evil/laao-1.zip' ),
			'encoded path traversal'  => array( 'https://github.com/TheAggressive/LAAO-Theme/releases/download/%2e%2e/%2e%2e/evil.zip' ),
			'different owner'         => array( 'https://github.com/Attacker/LAAO-Theme/releases/download/v1/laao-1.zip' ),
			'different repository'    => array( 'https://github.com/TheAggressive/Other-Theme/releases/download/v1/laao-1.zip' ),
			'not a zip'               => array( 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1/payload.php' ),
			'owner as query string'   => array( 'https://evil.example/?x=https://github.com/TheAggressive/LAAO-Theme/releases/download/v1/a.zip' ),
			'raw githubusercontent'   => array( 'https://raw.githubusercontent.com/TheAggressive/LAAO-Theme/main/a.zip' ),
			'subdomain lookalike'     => array( 'https://github.com.evil.example/TheAggressive/LAAO-Theme/releases/download/v1/a.zip' ),
			'empty string'            => array( '' ),
			'javascript scheme'       => array( 'javascript:alert(1)' ),
			'zipball on wrong host'   => array( 'https://github.com/repos/TheAggressive/LAAO-Theme/zipball/v1' ),
		);
	}

	/**
	 * Rejects anything outside the trusted origin and path.
	 *
	 * @param string $url Candidate URL.
	 * @return void
	 */
	#[DataProvider( 'rejected_package_urls' )]
	public function test_rejects_untrusted_package_urls( string $url ): void {
		$this->assertFalse(
			$this->releases->is_allowed_package_url( $url ),
			"Should have rejected: {$url}"
		);
	}

	/**
	 * Accepts only checksum sidecars beside a release asset.
	 *
	 * @return void
	 */
	public function test_checksum_url_allow_list(): void {
		$base = 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip';

		$this->assertTrue( $this->releases->is_allowed_checksum_url( $base . '.sha256' ) );
		$this->assertTrue( $this->releases->is_allowed_checksum_url( $base . '.sha256sum' ) );

		// The package itself is not a checksum, and the API host never serves one.
		$this->assertFalse( $this->releases->is_allowed_checksum_url( $base ) );
		$this->assertFalse(
			$this->releases->is_allowed_checksum_url(
				'https://api.github.com/repos/TheAggressive/LAAO-Theme/zipball/v1.9.0.sha256'
			)
		);
		$this->assertFalse( $this->releases->is_allowed_checksum_url( 'https://evil.example/laao.zip.sha256' ) );
	}

	/**
	 * Picks the .zip asset regardless of its position in the asset list.
	 *
	 * GitHub does not guarantee asset order, and every release now publishes a
	 * .sha256 sidecar alongside the package — so taking assets[0] could hand
	 * WordPress the checksum file to install.
	 *
	 * @return void
	 */
	public function test_selects_the_zip_asset_not_the_checksum_sidecar(): void {
		Functions\when( 'sanitize_title' )->alias(
			static fn( $t ) => strtolower( str_replace( array( '.', ' ' ), '-', (string) $t ) )
		);

		$url = $this->releases->get_release_asset_download_url(
			array(
				'assets' => array(
					array(
						'name'                 => 'laao-1.9.0.zip.sha256',
						'browser_download_url' => 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip.sha256',
					),
					array(
						'name'                 => 'laao-1.9.0.zip',
						'browser_download_url' => 'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip',
					),
				),
			)
		);

		$this->assertSame(
			'https://github.com/TheAggressive/LAAO-Theme/releases/download/v1.9.0/laao-1.9.0.zip',
			$url
		);
	}

	/**
	 * Refuses an asset whose URL points somewhere untrusted.
	 *
	 * @return void
	 */
	public function test_rejects_asset_with_untrusted_url(): void {
		Functions\when( 'sanitize_title' )->alias( static fn( $t ) => strtolower( (string) $t ) );

		$this->assertFalse(
			$this->releases->get_release_asset_download_url(
				array(
					'assets' => array(
						array(
							'name'                 => 'laao-1.9.0.zip',
							'browser_download_url' => 'https://evil.example/laao-1.9.0.zip',
						),
					),
				)
			)
		);
	}

	/**
	 * Recognises a source path belonging to this repository.
	 *
	 * @return void
	 */
	public function test_identifies_its_own_release_source(): void {
		$this->assertTrue( $this->releases->is_repository_source( '/tmp/TheAggressive-LAAO-Theme-abc123' ) );
		$this->assertFalse( $this->releases->is_repository_source( '/tmp/someone-else-plugin' ) );
	}
}
