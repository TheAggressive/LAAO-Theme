<?php
/**
 * Server render for the Hero block.
 *
 * Exposed to this file by WordPress:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @package LAAO
 */

if ( ! function_exists( 'laao_hero_context' ) ) {
	/**
	 * Builds the Interactivity API context for the hero carousel.
	 *
	 * @param array<int, array<string, mixed>> $slides Slide data.
	 * @return array<string, mixed> Interactivity context.
	 */
	function laao_hero_context( $slides ) {
		return array(
			'totalSlides' => count( $slides ),
		);
	}
}

	$post_type_selector = 'hero-banners';
	$number_of_slides   = $attributes['numberOfSlides'] ?? 5;

	$args = array(
		'post_type'              => $post_type_selector,
		'posts_per_page'         => $number_of_slides,
		'no_found_rows'          => true,
		'update_post_term_cache' => false,
	);

	$query  = new WP_Query( $args );
	$slides = array();

	while ( $query->have_posts() ) {
		$query->the_post();

		$raw_content = (string) get_the_content();
		$content     = null;

		if ( '' !== trim( $raw_content ) ) {
			// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- 'the_content' is a core hook; applying it is the documented way to render post content.
			$content = str_replace( array( '<p>', '</p>' ), '', (string) apply_filters( 'the_content', $raw_content ) );
		}

		$slides[] = array(
			'imageId' => has_post_thumbnail() ? (int) get_post_thumbnail_id( get_the_ID() ) : 0,
			'content' => $content,
		);
	}

	wp_reset_postdata();

	?>
<div class="wp-block-laao-hero">
	<div class="wp-block-laao-hero-caption-container">
		<div class="wp-block-laao-hero-caption"></div>
	</div>

	<?php echo wp_kses_post( $content ); ?>

	<div
		class="wp-block-laao-hero-slider"
		data-wp-interactive="laao/hero"
		data-wp-init="actions.init"
			<?php
				echo wp_kses_data(
					wp_interactivity_data_wp_context(
						laao_hero_context( $slides ),
					)
				);
				?>
		>

			<?php foreach ( $slides as $index => $slide ) : ?>
				<div
					class="wp-block-laao-hero-slide"
					data-wp-key="<?php echo esc_attr( $index ); ?>"
				<?php
				echo wp_kses_data(
					wp_interactivity_data_wp_context(
						array(
							'slideIndex' => $index,
							'caption'    => $slide['content'],
						)
					)
				)
				?>
					data-wp-class--is-active="callbacks.isActive"
				>
					<?php
					/*
					 * An <img> rather than a CSS background, which is what this
					 * was. A background cannot carry srcset, so every visitor
					 * downloaded the full-size original — a phone rendering the
					 * hero 400px wide still pulled the 1920px file. It also
					 * cannot be lazy-loaded or prioritised.
					 *
					 * The first slide is the LCP element on the front page, so
					 * it loads eagerly at high priority; the rest are behind an
					 * opacity transition and can wait.
					 *
					 * Not escaped with wp_kses_post(): it strips srcset, sizes,
					 * fetchpriority and decoding, which is the entire point of
					 * this markup. wp_get_attachment_image() already escapes.
					 */
					echo laao_trusted_html(
						wp_get_attachment_image(
							$slide['imageId'],
							'full',
							false,
							array(
								'class'         => 'wp-block-laao-hero-slide__image',
								'alt'           => '',
								'loading'       => 0 === $index ? 'eager' : 'lazy',
								'fetchpriority' => 0 === $index ? 'high' : 'auto',
								'decoding'      => 'async',
								'sizes'         => '100vw',
							)
						)
					);
					?>
				</div>
			<?php endforeach; ?>
	</div>
</div>
