<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

if ( ! function_exists( 'add_directives_to_inner_blocks' ) ) {
	function add_directives_to_inner_blocks( $block_content, $block ) {
		$allowed_blocks = array( 'wp-block-cover', 'wp-block-image', 'wp-block-media-text' );
		$slides         = new \WP_HTML_Tag_Processor( $block_content );
		$total_slides   = 0;

		// Get the main element.
		$slides->next_tag( array( 'class_name' => 'wp-block-block-developer-cookbook-iapi-gallery-slider' ) );
		// Set a bookmark so we can go back and update the context after counting the slides.
		$slides->set_bookmark( 'main' );

		while ( $slides->next_tag() ) {
			// Retrieve and iterate over the classes assigned.
			foreach ( $slides->class_list() as $class_name ) {
				if ( in_array( $class_name, $allowed_blocks, true ) ) {
					$slides->set_attribute( 'data-wp-interactive', 'iapi-gallery' );
					$slides->set_attribute( 'data-wp-init', 'callbacks.initSlide' );
					++$total_slides;
					// If we find a class, we can move on - this is still not very performant as the worst case is that we loop all classes against all allowed classes.
					// Not an issue with the tag processor, rather the code I wrote with it.
					continue;
				}
			}
		}

		// Go to the bookmark and release it.
		$slides->seek( 'main' );
		$slides->release_bookmark( 'main' );

		// Generate the context for the slider block.
		$context = array_merge(
			array(
				'autoplay'   => $block['attrs']['autoplay'] ?? false,
				'continuous' => $block['attrs']['continuous'] ?? false,
				'speed'      => $block['attrs']['speed'] ?? '3',
			),
			array(
				'slides'       => array(),
				'currentSlide' => 1,
				'totalSlides'  => $total_slides,
			)
		);

		// Define some global state for all instances based on attributes.
		// These will be updated by the appropriate getters but this will avoid the content flash in the client
		wp_interactivity_state(
			'iapi-gallery',
			array(
				'noPrevSlide' => ! $context['continuous'],
				'imageIndex'  => "{$context['currentSlide']}/{$context['totalSlides']}",
			)
		);

		$slides->set_attribute( 'data-wp-context', wp_json_encode( $context, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP ) );
		// Update the HTML.
		$block_content = $slides->get_updated_html();
		return $block_content;
	}
	add_filter( 'render_block_block-developer-cookbook/iapi-gallery-slider', 'add_directives_to_inner_blocks', 10, 2 );
}

?>
<div <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive='iapi-gallery'
	data-wp-on-document--keydown="actions.onKeyDown"
	data-wp-init="callbacks.initSlideShow"
>
	<div
		class="slider-container"
		data-wp-style--transform="state.currentPos"
		data-wp-on--touchstart="actions.onTouchStart"
		data-wp-on--touchend="actions.onTouchEnd"
	>
		<?php echo wp_kses_post( $content ); ?>
	</div>
	<div class="buttons">
		<button data-wp-on--click="actions.prevImage" data-wp-bind--disabled="state.noPrevSlide" aria-label="go to previous slide">&lt;</button>
		<p data-wp-text="state.imageIndex"></p>
		<button data-wp-on--click="actions.nextImage"data-wp-bind--disabled="state.noNextSlide" aria-label="go to next slide">&gt;</button>
	</div>
</div>
