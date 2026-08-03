<?php
/**
 * Server render for the Highlight Posts block.
 *
 * Renders a small grid of "highlighted" posts chosen by a date window stored in
 * post meta (highlight_start_date / highlight_end_date). Selection degrades in
 * three tiers so the section is never blank:
 *
 *   1. Posts whose highlight window contains "now", in random order.
 *   2. If none are active, the most recently expired highlights.
 *   3. If no highlight dates exist at all, the most recent posts.
 *
 * The rendered markup is cached in a transient whose TTL is shortened to land on
 * the next highlight state change, so a window opening or closing is reflected
 * promptly instead of waiting out a fixed interval.
 *
 * @package LAAO
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'laao_highlight_posts_base_args' ) ) {
	/**
	 * Base WP_Query arguments shared by all three selection tiers.
	 *
	 * @param string[] $post_types     Post types to draw from.
	 * @param int      $posts_per_page How many posts to return.
	 * @return array<string, mixed> Query arguments.
	 */
	function laao_highlight_posts_base_args( array $post_types, int $posts_per_page ): array {
		return array(
			'post_type'              => $post_types,
			'posts_per_page'         => $posts_per_page,
			'post_status'            => 'publish',
			'no_found_rows'          => true,
			'ignore_sticky_posts'    => true,
			'update_post_meta_cache' => true,
			'update_post_term_cache' => false,
		);
	}
}

if ( ! function_exists( 'laao_highlight_posts_query' ) ) {
	/**
	 * Resolves the post set to render, walking the three fallback tiers.
	 *
	 * @param string[] $post_types     Post types to draw from.
	 * @param int      $posts_per_page How many posts to return.
	 * @param string   $now            Current site-local time, MySQL format.
	 * @return WP_Query The first tier that produced results (possibly empty).
	 */
	function laao_highlight_posts_query( array $post_types, int $posts_per_page, string $now ): WP_Query {
		// Upper bound on how many active highlights enter the random pick. Keeps
		// the shuffle-in-PHP approach bounded; the active set is small by design,
		// so this should never be reached in practice.
		$candidate_cap = 100;

		// Tier 1: currently-active highlights, randomised.
		//
		// ORDER BY RAND() makes MySQL sort the entire matching set on every cache
		// miss. The active set is small and capped, so pull bare IDs and shuffle
		// in PHP instead — same result, an indexed query rather than a filesort.
		$candidate_args               = laao_highlight_posts_base_args( $post_types, $candidate_cap );
		$candidate_args['fields']     = 'ids';
		$candidate_args['orderby']    = 'date';
		$candidate_args['order']      = 'DESC';
		$candidate_args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- The highlight window lives in post meta; this is the block's defining query.
			'relation' => 'AND',
			array(
				'key'     => 'highlight_start_date',
				'value'   => $now,
				'compare' => '<=',
				'type'    => 'DATETIME',
			),
			array(
				'key'     => 'highlight_end_date',
				'value'   => $now,
				'compare' => '>=',
				'type'    => 'DATETIME',
			),
		);

		$active_ids = ( new WP_Query( $candidate_args ) )->posts;

		if ( ! empty( $active_ids ) ) {
			shuffle( $active_ids );
			$active_ids = array_slice( $active_ids, 0, $posts_per_page );

			$args             = laao_highlight_posts_base_args( $post_types, count( $active_ids ) );
			$args['post__in'] = $active_ids;
			$args['orderby']  = 'post__in';
			$featured_query   = new WP_Query( $args );

			if ( $featured_query->have_posts() ) {
				return $featured_query;
			}
		}

		// Tier 2: no active highlights — show the most recently expired ones so
		// the section never goes blank between highlight windows.
		$args               = laao_highlight_posts_base_args( $post_types, $posts_per_page );
		$args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- See tier 1.
			array(
				'key'     => 'highlight_end_date',
				'value'   => $now,
				'compare' => '<',
				'type'    => 'DATETIME',
			),
		);
		$args['orderby']    = 'meta_value';
		$args['meta_key']   = 'highlight_end_date'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Required to order by the highlight window.
		$args['order']      = 'DESC';

		$featured_query = new WP_Query( $args );

		if ( $featured_query->have_posts() ) {
			return $featured_query;
		}

		// Tier 3: no highlight dates exist at all — fall back to recent posts.
		$args            = laao_highlight_posts_base_args( $post_types, $posts_per_page );
		$args['orderby'] = 'date';
		$args['order']   = 'DESC';

		return new WP_Query( $args );
	}
}

if ( ! function_exists( 'laao_highlight_posts_cache_ttl' ) ) {
	/**
	 * Cache lifetime for the rendered markup.
	 *
	 * Defaults to five minutes, but shortens to land on the next highlight state
	 * change (the soonest future start or end date on any published post) so a
	 * window opening or closing is not masked by a stale transient.
	 *
	 * @param string $now Current site-local time, MySQL format.
	 * @return int TTL in seconds.
	 */
	function laao_highlight_posts_cache_ttl( string $now ): int {
		$default_ttl = 5 * MINUTE_IN_SECONDS;

		global $wpdb;

		// Deliberately uncached. This runs only on a transient miss (at most once
		// per TTL, floor 30s) and its whole purpose is to read the *current*
		// soonest state change — caching the answer would hand back a moment that
		// has already passed and silently stretch every TTL back out to the
		// default, defeating the mechanism.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- See above; no core API exposes "soonest future value across two meta keys".
		$next_change = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT MIN(pm.meta_value)
				 FROM {$wpdb->postmeta} pm
				 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
				 WHERE pm.meta_key IN ('highlight_start_date', 'highlight_end_date')
				   AND pm.meta_value > %s
				   AND p.post_status = 'publish'",
				$now
			)
		);

		if ( ! $next_change ) {
			return $default_ttl;
		}

		// Meta values are stored in site-local time. Convert to GMT before
		// comparing against a real UTC timestamp — current_time( 'timestamp' )
		// returns a local-shifted value and must not be mixed with time().
		$next_change_ts = strtotime( get_gmt_from_date( (string) $next_change ) . ' UTC' );

		if ( false === $next_change_ts ) {
			return $default_ttl;
		}

		$seconds_until = $next_change_ts - time();

		if ( $seconds_until > 0 && $seconds_until < $default_ttl ) {
			return max( 30, $seconds_until );
		}

		return $default_ttl;
	}
}

if ( ! function_exists( 'laao_render_featured_block' ) ) {
	/**
	 * Renders the block markup, reading through a transient cache.
	 *
	 * @param array<string, mixed> $attributes Block attributes.
	 * @return string Rendered HTML.
	 */
	function laao_render_featured_block( array $attributes ): string {
		$post_types     = ! empty( $attributes['selectedPostTypes'] ) ? (array) $attributes['selectedPostTypes'] : array( 'post' );
		$posts_per_page = (int) ( $attributes['postsPerPage'] ?? 4 );

		$cache_key = \LAAO\Core\Cache_Version::key(
			'highlight_posts',
			implode( ',', $post_types ) . '|' . $posts_per_page
		);
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return (string) $cached;
		}

		$now            = current_time( 'mysql' );
		$featured_query = laao_highlight_posts_query( $post_types, $posts_per_page, $now );

		ob_start();

		if ( $featured_query->have_posts() ) :
			while ( $featured_query->have_posts() ) :
				$featured_query->the_post();
				$archive_url = get_post_type_archive_link( get_post_type() );
				?>
				<article class="featured-item">
					<a class="featured-item-link" href="<?php echo esc_url( $archive_url ); ?>">
						<figure class="featured-item-img">
							<?php if ( has_post_thumbnail() ) : ?>
								<?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?>
							<?php endif; ?>
						</figure>
						<div class="featured-item-content">
							<header class="featured-list-title">
								<h3><?php echo esc_html( get_the_title() ); ?></h3>
								<div class="featured-list-credits">
									<div class="article-credits">
										<span><?php echo esc_html( get_post_meta( get_the_ID(), 'by_options', true ) ); ?> <?php echo esc_html( get_post_meta( get_the_ID(), 'author', true ) ); ?></span>
									</div>
								</div>
							</header>
							<span class="featured-list-preview"><?php echo wp_kses_post( wp_html_excerpt( get_the_excerpt(), 275, '...' ) ); ?></span>
						</div>
					</a>
				</article>
				<?php
			endwhile;
			wp_reset_postdata();
		else :
			echo '<p>No featured posts found</p>';
		endif;

		$output = (string) ob_get_clean();

		set_transient( $cache_key, $output, laao_highlight_posts_cache_ttl( $now ) );

		return $output;
	}
}

echo wp_kses_post( laao_render_featured_block( $attributes ) );
