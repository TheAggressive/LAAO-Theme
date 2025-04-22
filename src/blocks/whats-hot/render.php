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
$animation_type         = $attributes['animationType'] ?? 'fade-up';
$animation_delay        = $attributes['animationDelay'] ?? 100;
$animation_duration     = $attributes['animationDuration'] ?? 800;
$enable_animation       = $attributes['enableAnimation'] ?? true;

// Query the latest posts from wh_cover post type
$args = array(
	'post_type'      => 'wh_cover',
	'posts_per_page' => $number_of_posts,
	'post_status'    => 'publish',
	'orderby'        => 'date',
	'order'          => 'DESC',
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

<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<h3 class="whats-hot-title"><?php echo esc_html__( 'What\'s Hot', 'whats-hot' ); ?></h3>

	<?php if ( $query->have_posts() ) : ?>
		<ul class="whats-hot-grid">
			<?php
			// Counter for staggered animations
			$item_count = 0;

			while ( $query->have_posts() ) :
				$query->the_post();
				++$item_count;

				$current_post_id = get_the_ID();
				$post_title      = get_the_title();

				// Get link - either from meta or use the default permalink
				$custom_link = $use_link_meta ? get_post_meta( $current_post_id, 'wh_link_to', true ) : '';
				$post_link   = ! empty( $custom_link ) ? $custom_link : get_permalink();

				// Get featured image
				$thumbnail_id = get_post_thumbnail_id( $current_post_id );
				$image_url    = wp_get_attachment_image_url( $thumbnail_id, 'large' );
				$image_alt    = get_post_meta( $thumbnail_id, '_wp_attachment_image_alt', true );
				if ( empty( $image_alt ) ) {
					$image_alt = $post_title;
				}

				// Get all relevant post meta for display
				$photo_credit = get_post_meta( $current_post_id, 'wh_photo_credit', true );
				$picture_id   = get_post_meta( $current_post_id, 'wh_picture_id', true );

				// Get any other meta fields that might be relevant
				$location = get_post_meta( $current_post_id, 'location', true );
				$author   = get_post_meta( $current_post_id, 'author', true );

				// Build caption text with all available meta
				$caption_text = '';

				// Add photo credit if available
				if ( ! empty( $photo_credit ) ) {
					$caption_text .= ' (Photo ' . esc_html( $photo_credit ) . ')';
				}

				// Add picture ID if available
				if ( ! empty( $picture_id ) ) {
					$caption_text .= esc_html( $picture_id );
				}

				// Add location if available
				if ( ! empty( $location ) ) {
					$caption_text .= ' Location: ' . esc_html( $location );
				}

				// Add author if available
				if ( ! empty( $author ) ) {
					$caption_text .= ' By: ' . esc_html( $author );
				}

				// Animation attributes
				$animation_item_delay = ( $item_count - 1 ) * $animation_delay;
				$animation_classes    = $enable_animation ? 'aos-init aos-animate' : '';
				$animation_attrs      = $enable_animation ?
					sprintf(
						' data-aos="%s" data-aos-delay="%d" data-aos-duration="%d"',
						esc_attr( $animation_type ),
						$animation_item_delay,
						$animation_duration
					) : '';
				?>
				<li class="whats-hot-item <?php echo esc_attr( $animation_classes ); ?>"
					<?php echo wp_kses_post( $animation_attrs ); ?>
					data-item-index="<?php echo esc_attr( $item_count ); ?>">

					<a href="<?php echo esc_url( $post_link ); ?>" class="whats-hot-link">
						<?php if ( $display_featured_image && $image_url ) : ?>
							<figure class="whats-hot-figure">
								<img src="<?php echo esc_url( $image_url ); ?>"
									alt="<?php echo esc_attr( $image_alt ); ?>"
									class="whats-hot-image"
									loading="lazy" />

								<?php if ( $display_caption && ! empty( $caption_text ) ) : ?>
									<figcaption class="whats-hot-caption">
										<?php echo esc_html( $caption_text ); ?>
									</figcaption>
								<?php endif; ?>
							</figure>
						<?php else : ?>
							<div class="whats-hot-text"><?php echo esc_html( $post_title ); ?></div>
						<?php endif; ?>
					</a>
				</li>
			<?php endwhile; ?>
		</ul>
	<?php else : ?>
		<p class="whats-hot-no-posts"><?php echo esc_html__( 'No What\'s Hot posts found.', 'whats-hot' ); ?></p>
	<?php endif; ?>

	<?php wp_reset_postdata(); ?>

	<!-- Inner blocks content - this is where the animate-on-scroll block can be added -->
	<div class="whats-hot-inner-blocks"><?php echo wp_kses_post( $content ); ?></div>
</div>

<?php
// Get the output buffer contents and clean the buffer
$output = ob_get_clean();

// Return the output
echo wp_kses_post( $output );
