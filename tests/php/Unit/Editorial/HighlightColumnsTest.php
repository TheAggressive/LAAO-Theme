<?php

namespace LAAO\Tests\Unit\Editorial;

use Brain\Monkey;
use Brain\Monkey\Functions;
use LAAO\Editorial\Highlight_Columns;
use PHPUnit\Framework\TestCase;

/**
 * Minimal wpdb stand-in with a configurable get_results() return value.
 */
class FakeWpdb {
	public string $postmeta = 'wp_postmeta';
	public string $posts    = 'wp_posts';

	private array $rows;
	public int    $call_count = 0;

	public function __construct( array $rows = array() ) {
		$this->rows = $rows;
	}

	public function get_results( string $query, string $output = 'OBJECT' ): array { // phpcs:ignore
		++$this->call_count;
		return $this->rows;
	}
}

class HighlightColumnsTest extends TestCase {

	private Highlight_Columns $highlight_columns;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\stubTranslationFunctions();
		Functions\stubEscapeFunctions();

		$this->highlight_columns = new Highlight_Columns( array( 'arts', 'theatre' ) );

		// Reset the static overlap cache between tests (setAccessible no-op since PHP 8.1).
		$ref = new \ReflectionProperty( Highlight_Columns::class, 'overlap_cache' );
		$ref->setValue( null, null );
	}

	protected function tearDown(): void {
		unset( $GLOBALS['wpdb'] );
		Monkey\tearDown();
		parent::tearDown();
	}

	// -------------------------------------------------------------------------
	// add_column
	// -------------------------------------------------------------------------

	public function test_add_column_appends_highlight_column(): void {
		$result = $this->highlight_columns->add_column( array( 'title' => 'Title', 'date' => 'Date' ) );

		$this->assertArrayHasKey( 'highlight_schedule', $result );
	}

	public function test_add_column_preserves_existing_columns(): void {
		$columns = array( 'title' => 'Title', 'date' => 'Date' );
		$result  = $this->highlight_columns->add_column( $columns );

		$this->assertArrayHasKey( 'title', $result );
		$this->assertArrayHasKey( 'date', $result );
	}

	// -------------------------------------------------------------------------
	// render_column — wrong column is a no-op
	// -------------------------------------------------------------------------

	public function test_render_column_ignores_other_columns(): void {
		ob_start();
		$this->highlight_columns->render_column( 'title', 1 );
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	// -------------------------------------------------------------------------
	// render_column — no dates set
	// -------------------------------------------------------------------------

	public function test_render_column_shows_dash_when_no_dates(): void {
		Functions\when( 'get_post_meta' )->justReturn( '' );

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 42 );
		$output = ob_get_clean();

		$this->assertStringContainsString( '—', $output );
		$this->assertStringNotContainsString( 'Active', $output );
		$this->assertStringNotContainsString( 'Scheduled', $output );
	}

	// -------------------------------------------------------------------------
	// render_column — active schedule
	// -------------------------------------------------------------------------

	public function test_render_column_shows_active_badge_for_current_schedule(): void {
		$tz    = new \DateTimeZone( 'America/Los_Angeles' );
		$now   = new \DateTime( 'now', $tz );
		$start = ( clone $now )->modify( '-1 day' )->format( 'Y-m-d H:i:s' );
		$end   = ( clone $now )->modify( '+1 day' )->format( 'Y-m-d H:i:s' );

		$this->stub_post_meta( $start, $end );
		Functions\when( 'wp_timezone' )->justReturn( $tz );
		$GLOBALS['wpdb'] = new FakeWpdb();

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 1 );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Active', $output );
		$this->assertStringNotContainsString( 'Scheduled', $output );
	}

	// -------------------------------------------------------------------------
	// render_column — upcoming schedule
	// -------------------------------------------------------------------------

	public function test_render_column_shows_scheduled_badge_for_future_schedule(): void {
		$tz    = new \DateTimeZone( 'America/Los_Angeles' );
		$now   = new \DateTime( 'now', $tz );
		$start = ( clone $now )->modify( '+1 day' )->format( 'Y-m-d H:i:s' );
		$end   = ( clone $now )->modify( '+3 days' )->format( 'Y-m-d H:i:s' );

		$this->stub_post_meta( $start, $end );
		Functions\when( 'wp_timezone' )->justReturn( $tz );
		$GLOBALS['wpdb'] = new FakeWpdb();

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 1 );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Scheduled', $output );
		$this->assertStringNotContainsString( 'Active', $output );
	}

	// -------------------------------------------------------------------------
	// render_column — past schedule (no badge, but dates shown)
	// -------------------------------------------------------------------------

	public function test_render_column_shows_no_badge_for_expired_schedule(): void {
		$tz    = new \DateTimeZone( 'America/Los_Angeles' );
		$now   = new \DateTime( 'now', $tz );
		$start = ( clone $now )->modify( '-3 days' )->format( 'Y-m-d H:i:s' );
		$end   = ( clone $now )->modify( '-1 day' )->format( 'Y-m-d H:i:s' );

		$this->stub_post_meta( $start, $end );
		Functions\when( 'wp_timezone' )->justReturn( $tz );

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 1 );
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'Active', $output );
		$this->assertStringNotContainsString( 'Scheduled', $output );
		$this->assertStringContainsString( 'Start:', $output );
		$this->assertStringContainsString( 'End:', $output );
	}

	// -------------------------------------------------------------------------
	// render_column — overlap warning threshold
	// -------------------------------------------------------------------------

	public function test_render_column_shows_overlap_warning_at_4_or_more(): void {
		$tz    = new \DateTimeZone( 'America/Los_Angeles' );
		$now   = new \DateTime( 'now', $tz );
		$start = ( clone $now )->modify( '-1 day' )->format( 'Y-m-d H:i:s' );
		$end   = ( clone $now )->modify( '+1 day' )->format( 'Y-m-d H:i:s' );

		$this->stub_post_meta( $start, $end );
		Functions\when( 'wp_timezone' )->justReturn( $tz );
		$GLOBALS['wpdb'] = new FakeWpdb( array( array( 'post_id' => '1', 'overlap_count' => '5' ) ) );

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 1 );
		$output = ob_get_clean();

		$this->assertStringContainsString( 'overlapping posts', $output );
		$this->assertStringContainsString( '5', $output );
	}

	public function test_render_column_hides_overlap_warning_below_4(): void {
		$tz    = new \DateTimeZone( 'America/Los_Angeles' );
		$now   = new \DateTime( 'now', $tz );
		$start = ( clone $now )->modify( '-1 day' )->format( 'Y-m-d H:i:s' );
		$end   = ( clone $now )->modify( '+1 day' )->format( 'Y-m-d H:i:s' );

		$this->stub_post_meta( $start, $end );
		Functions\when( 'wp_timezone' )->justReturn( $tz );
		$GLOBALS['wpdb'] = new FakeWpdb( array( array( 'post_id' => '1', 'overlap_count' => '3' ) ) );

		ob_start();
		$this->highlight_columns->render_column( 'highlight_schedule', 1 );
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'overlapping posts', $output );
	}

	// -------------------------------------------------------------------------
	// get_overlap_counts — batch query result mapping
	// -------------------------------------------------------------------------

	public function test_get_overlap_counts_maps_rows_to_post_id_keys(): void {
		$rows = array(
			array( 'post_id' => '10', 'overlap_count' => '3' ),
			array( 'post_id' => '20', 'overlap_count' => '7' ),
		);
		$GLOBALS['wpdb'] = new FakeWpdb( $rows );

		$result = $this->call_get_overlap_counts();

		$this->assertSame( array( 10 => 3, 20 => 7 ), $result );
	}

	public function test_get_overlap_counts_returns_empty_array_when_no_overlaps(): void {
		$GLOBALS['wpdb'] = new FakeWpdb();

		$result = $this->call_get_overlap_counts();

		$this->assertSame( array(), $result );
	}

	public function test_get_overlap_counts_only_queries_database_once(): void {
		$wpdb            = new FakeWpdb();
		$GLOBALS['wpdb'] = $wpdb;

		$this->call_get_overlap_counts();
		$this->call_get_overlap_counts();

		$this->assertSame( 1, $wpdb->call_count, 'get_results() should be called once; static cache should serve subsequent calls.' );
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private function stub_post_meta( string $start, string $end ): void {
		Functions\when( 'get_post_meta' )->alias(
			function ( int $post_id, string $key ) use ( $start, $end ): string {
				return 'highlight_start_date' === $key ? $start : $end;
			}
		);
	}

	private function call_get_overlap_counts(): array {
		$ref = new \ReflectionMethod( Highlight_Columns::class, 'get_overlap_counts' );
		return $ref->invoke( $this->highlight_columns );
	}
}
