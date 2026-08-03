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
			'imageUrl' => has_post_thumbnail() ? get_the_post_thumbnail_url( get_the_ID(), 'full' ) : null,
			'content'  => $content,
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
					style="background-image: url('<?php echo esc_url( $slide['imageUrl'] ); ?>');"
				></div>
			<?php endforeach; ?>
	</div>
</div>
