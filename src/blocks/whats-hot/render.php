<?php

/**
 * Renders the 'What's Hot' block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the block content.
 */

// Fallback values for all attributes with ?? operator
$number_of_posts        = $attributes['numberOfPosts'] ?? 4;
$display_featured_image = $attributes['displayFeaturedImage'] ?? true;
$display_caption        = $attributes['displayCaption'] ?? true;
$use_link_meta          = $attributes['useLinkMeta'] ?? true;

$cache_key = 'laao_whats_hot_' . md5( $number_of_posts . (int) $display_featured_image . (int) $display_caption . (int) $use_link_meta );
$cached    = get_transient( $cache_key );

if ( false !== $cached ) {
	echo wp_kses_post( $cached );
	return;
}

// Query the latest posts from wh_cover post type
$args = array(
	'post_type'              => 'wh_cover',
	'posts_per_page'         => $number_of_posts,
	'post_status'            => 'publish',
	'orderby'                => 'date',
	'order'                  => 'DESC',
	'no_found_rows'          => true,
	'update_post_meta_cache' => true,
	'update_post_term_cache' => false,
);

$query = new WP_Query( $args );

// Block wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'whats-hot-section',
	)
);

// Start output buffer to collect HTML
ob_start();
?>

<?php if ( $query->have_posts() ) : ?>
	<?php
	// Counter for staggered animations
	$item_count = 0;

	while ( $query->have_posts() ) :
		$query->the_post();
		++$item_count;

		$current_post_id = get_the_ID();

		// Get link - either from meta or use the default permalink
		$custom_link = $use_link_meta ? get_post_meta( $current_post_id, 'wh_link_to', true ) : '';
		$post_link   = ! empty( $custom_link ) ? $custom_link : get_permalink();

		// Get all relevant post meta for display
		$photo_credit = get_post_meta( $current_post_id, 'wh_photo_credit', true );
		$picture_id   = get_post_meta( $current_post_id, 'wh_picture_id', true );

		// Build caption text with all available meta
		$caption_text = ! empty( $picture_id ) ? wp_kses_post( $picture_id ) : '';

		// Get featured image — fall back to caption text if attachment alt is empty.
		$thumbnail_id  = get_post_thumbnail_id( $current_post_id );
		$attached_alt  = get_post_meta( $thumbnail_id, '_wp_attachment_image_alt', true );
		$alt           = ! empty( $attached_alt ) ? $attached_alt : wp_strip_all_tags( $caption_text );
		$thumbnail_img = wp_get_attachment_image(
			$thumbnail_id,
			'large',
			false,
			array(
				'class'   => 'whats-hot-image',
				'loading' => 'lazy',
				'alt'     => $alt,
			)
		);

		?>
		<article class="whats-hot-item"
			data-item-index="<?php echo esc_attr( $item_count ); ?>">

			<a href="<?php echo esc_url( get_site_url() . '/' . $post_link ); ?>" class="whats-hot-link">
				<?php if ( $display_featured_image && $thumbnail_img ) : ?>
					<figure class="whats-hot-figure">
						<div class="whats-hot-image-container">
							<?php echo wp_kses_post( $thumbnail_img ); ?>
						</div>

						<?php if ( $display_caption && ! empty( $caption_text ) ) : ?>
							<figcaption class="whats-hot-caption">
								<?php echo wp_kses_post( $caption_text ); ?>
							</figcaption>
						<?php endif; ?>
					</figure>
				<?php else : ?>
					<div class="whats-hot-text"><?php echo esc_html( get_the_title() ); ?></div>
				<?php endif; ?>
			</a>
		</article>
	<?php endwhile; ?>
<?php else : ?>
	<p class="whats-hot-no-posts"><?php echo esc_html__( 'Sorry, No What\'s Hot posts found.', 'whats-hot' ); ?></p>
<?php endif; ?>

<?php wp_reset_postdata(); ?>

<?php
// Get the output buffer contents and clean the buffer
$output = ob_get_clean();

set_transient( $cache_key, $output, HOUR_IN_SECONDS );

// Return the output
echo wp_kses_post( $output );
