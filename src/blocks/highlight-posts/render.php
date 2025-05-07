<?php

if ( ! function_exists( 'laao_render_featured_block' ) ) {
	function laao_render_featured_block( $attributes ) {
		ob_start();
		$wrapper_attributes = get_block_wrapper_attributes();
		$post_types         = ! empty( $attributes['selectedPostTypes'] ) ? $attributes['selectedPostTypes'] : array( 'post' );
		$posts_per_page     = $attributes['postsPerPage'] ?? 4;

		$args = array(
			'post_type'      => $post_types,
			'posts_per_page' => $posts_per_page,
			'tag'            => 'featured',
			'post_status'    => 'publish',
			'orderby'        => 'rand',
		);

		$featured_query = new WP_Query( $args );

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

		return ob_get_clean();
	}
}

echo wp_kses_post( laao_render_featured_block( $attributes, $content, $block ) );
