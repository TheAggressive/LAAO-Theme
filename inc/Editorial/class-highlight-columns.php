<?php

namespace LAAO\Editorial;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Highlight_Columns {

	private array $editorial_post_types;

	/**
	 * Request-level cache: post_id => overlap_count for all scheduled posts.
	 * Populated on first use via a single batch query.
	 */
	private static ?array $overlap_cache = null;

	public function __construct( array $editorial_post_types ) {
		$this->editorial_post_types = $editorial_post_types;
	}

	public function init(): void {
		add_action( 'init', array( $this, 'register' ) );
	}

	public function register(): void {
		foreach ( $this->editorial_post_types as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( $this, 'add_column' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( $this, 'render_column' ), 10, 2 );
		}
	}

	public function add_column( array $columns ): array {
		$columns['highlight_schedule'] = __( 'Highlight', 'laao' );
		return $columns;
	}

	public function render_column( string $column, int $post_id ): void {
		if ( 'highlight_schedule' !== $column ) {
			return;
		}

		$start = get_post_meta( $post_id, 'highlight_start_date', true );
		$end   = get_post_meta( $post_id, 'highlight_end_date', true );

		if ( ! $start && ! $end ) {
			echo '<span style="color:#999;">—</span>';
			return;
		}

		$tz       = wp_timezone();
		$now      = new \DateTime( 'now', $tz );
		$start_dt = \DateTime::createFromFormat( 'Y-m-d H:i:s', $start, $tz );
		$end_dt   = \DateTime::createFromFormat( 'Y-m-d H:i:s', $end, $tz );
		$active   = $start_dt && $end_dt && $start_dt <= $now && $end_dt >= $now;
		$upcoming = $start_dt && $start_dt > $now;

		if ( $active ) {
			echo '<span style="display:inline-block;padding:2px 8px;background:#00a32a;color:#fff;border-radius:3px;font-size:11px;font-weight:600;margin-bottom:4px;">Active</span><br>';
		} elseif ( $upcoming ) {
			echo '<span style="display:inline-block;padding:2px 8px;background:#ddd;color:#555;border-radius:3px;font-size:11px;font-weight:600;margin-bottom:4px;">Scheduled</span><br>';
		}

		$format_date = function ( string $mysql_date ) use ( $tz ): string {
			$dt = \DateTime::createFromFormat( 'Y-m-d H:i:s', $mysql_date, $tz );
			return $dt ? $dt->format( 'M j, Y g:i a' ) : $mysql_date;
		};

		if ( $start ) {
			echo '<small><strong>Start:</strong> ' . esc_html( $format_date( $start ) ) . '</small><br>';
		}
		if ( $end ) {
			echo '<small><strong>End:</strong> ' . esc_html( $format_date( $end ) ) . '</small>';
		}

		if ( ( $active || $upcoming ) && $start && $end ) {
			$overlaps      = $this->get_overlap_counts();
			$overlap_count = $overlaps[ $post_id ] ?? 0;

			if ( $overlap_count >= 4 ) {
				echo '<br><span style="display:inline-block;padding:2px 6px;background:#fcf0f1;color:#c02b0a;border:1px solid #f5c0c0;border-radius:3px;font-size:11px;margin-top:4px;">&#9888; ' . esc_html( $overlap_count ) . ' overlapping posts</span>';
			}
		}
	}

	/**
	 * Returns overlap counts for all scheduled posts in a single query,
	 * cached for the duration of the request.
	 *
	 * @return array<int,int> Map of post_id => number of overlapping published posts.
	 */
	private function get_overlap_counts(): array {
		if ( null !== self::$overlap_cache ) {
			return self::$overlap_cache;
		}

		global $wpdb;

		// Single query: for each post A with a highlight schedule, count how many
		// OTHER published posts B have a date range that overlaps with A.
		// Overlap condition: B_start <= A_end AND B_end >= A_start
		$rows = $wpdb->get_results(
			"SELECT a.post_id, COUNT(DISTINCT b.post_id) AS overlap_count
			FROM {$wpdb->postmeta} a
			JOIN {$wpdb->postmeta} a_end ON a.post_id = a_end.post_id
				AND a_end.meta_key = 'highlight_end_date'
			JOIN {$wpdb->postmeta} b ON b.meta_key = 'highlight_start_date'
				AND b.post_id != a.post_id
			JOIN {$wpdb->postmeta} b_end ON b.post_id = b_end.post_id
				AND b_end.meta_key = 'highlight_end_date'
			JOIN {$wpdb->posts} p ON b.post_id = p.ID
			WHERE a.meta_key = 'highlight_start_date'
			AND b.meta_value <= a_end.meta_value
			AND b_end.meta_value >= a.meta_value
			AND p.post_status = 'publish'
			GROUP BY a.post_id",
			ARRAY_A
		);

		self::$overlap_cache = array();
		foreach ( $rows as $row ) {
			self::$overlap_cache[ (int) $row['post_id'] ] = (int) $row['overlap_count'];
		}

		return self::$overlap_cache;
	}
}
