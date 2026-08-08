<?php
/**
 * Unit tests for LAAO\Accessibility\Ad_Link_Labels.
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit\Accessibility;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Accessibility\Ad_Link_Labels;
use PHPUnit\Framework\TestCase;

class AdLinkLabelsTest extends TestCase {

	/**
	 * Subject under test.
	 *
	 * @var Ad_Link_Labels
	 */
	private Ad_Link_Labels $labels;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'wp_strip_all_tags' )->alias(
			// phpcs:ignore WordPress.WP.AlternativeFunctions -- this IS the stand-in for it.
			static fn( $text ) => trim( strip_tags( (string) $text ) )
		);
		Functions\when( '__' )->returnArg();

		Functions\when( 'get_post_type' )->alias(
			static fn( $id ) => in_array( (int) $id, array( 48695, 99999 ), true ) ? 'ads' : 'post'
		);

		Functions\when( 'get_the_title' )->alias(
			static function ( $id ) {
				return 48695 === (int) $id ? 'Theatricum Botanicum summer season' : '';
			}
		);

		$this->labels = new Ad_Link_Labels();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Renders an image's attributes as they would be during a thumbnail fetch.
	 *
	 * @param int                   $post_id Post whose thumbnail is rendering.
	 * @param array<string, string> $attr    Incoming attributes.
	 * @return array<string, string>
	 */
	private function during_thumbnail( int $post_id, array $attr ): array {
		$this->labels->begin_ad( $post_id );
		$result = $this->labels->name_ad_image( $attr );
		$this->labels->end_ad( $post_id );

		return $result;
	}

	public function test_ad_image_without_alt_is_named_from_the_ad_title(): void {
		$result = $this->during_thumbnail( 48695, array( 'alt' => '' ) );

		$this->assertSame(
			'Advertisement: Theatricum Botanicum summer season',
			$result['alt'],
			'An ad image with no alt leaves its link with no accessible name.'
		);
	}

	public function test_missing_alt_key_is_treated_as_no_alt(): void {
		$result = $this->during_thumbnail( 48695, array( 'class' => 'no-lazy-load' ) );

		$this->assertSame( 'Advertisement: Theatricum Botanicum summer season', $result['alt'] );
		$this->assertSame( 'no-lazy-load', $result['class'], 'Other attributes must survive untouched.' );
	}

	public function test_existing_alt_text_is_never_overwritten(): void {
		$result = $this->during_thumbnail( 48695, array( 'alt' => 'Written by an editor' ) );

		$this->assertSame( 'Written by an editor', $result['alt'] );
	}

	public function test_whitespace_only_alt_counts_as_empty(): void {
		$result = $this->during_thumbnail( 48695, array( 'alt' => '   ' ) );

		$this->assertSame( 'Advertisement: Theatricum Botanicum summer season', $result['alt'] );
	}

	public function test_non_ad_thumbnails_are_untouched(): void {
		// A regular post's featured image. An empty alt there is a normal
		// editorial choice and not this class's business.
		$result = $this->during_thumbnail( 1234, array( 'alt' => '' ) );

		$this->assertSame( '', $result['alt'] );
	}

	public function test_ad_without_a_usable_title_is_left_alone(): void {
		// A generic label would satisfy the checker while telling a listener
		// nothing, hiding a real failure from the next audit.
		$result = $this->during_thumbnail( 99999, array( 'alt' => '' ) );

		$this->assertSame( '', $result['alt'] );
	}

	public function test_images_outside_a_thumbnail_fetch_are_untouched(): void {
		// wp_get_attachment_image_attributes fires for every image on the page,
		// not only thumbnails. Without the begin/end bracket there is no ad in
		// scope and nothing should be added.
		$this->assertSame(
			array( 'alt' => '' ),
			$this->labels->name_ad_image( array( 'alt' => '' ) )
		);
	}

	public function test_ad_scope_does_not_leak_to_the_next_image(): void {
		$this->labels->begin_ad( 48695 );
		$this->labels->end_ad( 48695 );

		$this->assertSame(
			array( 'alt' => '' ),
			$this->labels->name_ad_image( array( 'alt' => '' ) ),
			'A stale ad ID would label the next unrelated image on the page.'
		);
	}

	public function test_non_array_attributes_do_not_fatal(): void {
		$this->labels->begin_ad( 48695 );

		// A misbehaving plugin filtering this to a non-array must not take the
		// page down from inside an image render.
		$this->assertIsArray( $this->labels->name_ad_image( null ) );
	}
}
