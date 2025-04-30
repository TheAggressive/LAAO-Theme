<?php

/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

$wrapper_attributes = get_block_wrapper_attributes();
$post_types         = isset( $attributes['selectedPostTypes'] ) && ! empty( $attributes['selectedPostTypes'] )
	? $attributes['selectedPostTypes']
	: array( 'post' ); // Default to standard posts if nothing selected
$posts_per_page     = isset( $attributes['postsPerPage'] ) ? $attributes['postsPerPage'] : 4;

// Query posts with the selected post types
$args = array(
	'post_type'      => $post_types,
	'posts_per_page' => $posts_per_page,
	'tag'            => 'featured',
	'post_status'    => 'publish',
);

$featured_query = new WP_Query( $args );

if ( $featured_query->have_posts() ) :
	while ( $featured_query->have_posts() ) :
		$featured_query->the_post();
		?>
		<article class="featured-item">
			<a class="grid grid-cols-1 grid-cols-5@md" href="<?php echo esc_url( get_permalink() ); ?>">
				<figure class="featured-list-img grid col-span-2">
					<?php if ( has_post_thumbnail() ) : ?>
						<?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?>
					<?php endif; ?>
				</figure>
				<div class="featured-list-content grid grid-rows-2 col-span-3">
					<header class="featured-list-title">
						<?php echo esc_html( get_the_title() ); ?>
						<div class="featured-list-credits">
							<div class="article-credits">
								<span>By <?php echo esc_html( get_the_author() ); ?></span>
							</div>
						</div>
					</header>
					<span class="featured-list-preview"><?php echo wp_kses_post( get_the_excerpt() ); ?></span>
				</div>
			</a>
		</article>
		<?php
	endwhile;
	wp_reset_postdata();
else :
	echo '<p>No featured posts found</p>';
endif;
