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

$context = array( 'images' => $attributes['images'] );

if ( ! function_exists( 'laao_render_event_gallery' ) ) {
	function laao_render_event_gallery( $content ) {
		if ( false === stripos( $content, '<img' ) ) {
			return '';
		}

		$p = new WP_HTML_Tag_Processor( $content );

		if ( ! $p->next_tag( 'img' ) || null === $p->get_attribute( 'src' ) ) {
			return '';
		}

		$p->seek( 'img' );
		$p->set_attribute( 'data-wp-init', 'something' );

		return $p->get_updated_html();
	}
}

if ( ! function_exists( 'laao_render_event_gallery_lightbox' ) ) {
	function laao_render_event_gallery_lightbox() {
		echo <<<HTML
		<section class="aggressive-lightbox" data-wp-interactive="laao/event-gallery" data-wp-bind--hidden="!state.overlayEnabled">
			<header class="aggressive-lightbox-header">
				<ul class="aggressive-lightbox-social">
					<li class="aggressive-lightbox-social-item">
						<a class="aggressive-lightbox-social-link aggressive-lightbox-social-twitter-link" href="https://twitter.com/intent/tweet?url=https://laartsonline.com/?attachment_id=49569&amp;via=LAArtsOnlinecom" aria-label="Share this on Twitter">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
								<path d="M26.37,26l-8.795-12.822l0.015,0.012L25.52,4h-2.65l-6.46,7.48L11.28,4H4.33l8.211,11.971L12.54,15.97L3.88,26h2.65 l7.182-8.322L19.42,26H26.37z M10.23,6l12.34,18h-2.1L8.12,6H10.23z"></path>
							</svg>
						</a>
					</li>
					<li class="aggressive-lightbox-social-item">
						<a class="aggressive-lightbox-social-link aggressive-lightbox-social-facebook-link" href="https://www.facebook.com/sharer/sharer.php?u=https://laartsonline.com/?attachment_id=49569" aria-label="Share this on Facebook">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M17.525,9H14V7c0-1.032,0.084-1.682,1.563-1.682h1.868v-3.18C16.522,2.044,15.608,1.998,14.693,2 C11.98,2,10,3.657,10,6.699V9H7v4l3-0.001V22h4v-9.003l3.066-0.001L17.525,9z"></path>
							</svg>
						</a>
					</li>
					<li class="aggressive-lightbox-social-item">
						<a class="aggressive-lightbox-social-link aggressive-lightbox-social-linkedin-link" href="https://www.linkedin.com/shareArticle?mini=true&amp;url=https://laartsonline.com/?attachment_id=49569" aria-label="Share this on Linkedin">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
								<path d="M9,25H4V10h5V25z M6.501,8C5.118,8,4,6.879,4,5.499S5.12,3,6.501,3C7.879,3,9,4.121,9,5.499C9,6.879,7.879,8,6.501,8z M27,25h-4.807v-7.3c0-1.741-0.033-3.98-2.499-3.98c-2.503,0-2.888,1.896-2.888,3.854V25H12V9.989h4.614v2.051h0.065 c0.642-1.18,2.211-2.424,4.551-2.424c4.87,0,5.77,3.109,5.77,7.151C27,16.767,27,25,27,25z"></path>
							</svg>
						</a>
					</li>
					<li class="aggressive-lightbox-social-item">
						<a class="aggressive-lightbox-social-link aggressive-lightbox-social-email-link" href="mailto:?subject=Check%20this%20out%20on%20LAArtsOnline.com!&amp;body=I%20thought%20you%20might%20enjoy%20this!%20https://laartsonline.com/?attachment_id=49569" aria-label="Share this in Email">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path d="M0 12l11 3.1 7-8.1-8.156 5.672-4.312-1.202 15.362-7.68-3.974 14.57-3.75-3.339-2.17 2.925v-.769l-2-.56v7.383l4.473-6.031 4.527 4.031 6-22z"></path>
							</svg>
						</a>
					</li>
				</ul>
				<a class="aggressive-lightbox-close" href="#" aria-label="Close lightbox" data-wp-on--click='actions.handleClick'>
					<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
						<path d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path>
					</svg>
				</a>
			</header>
			<section class="aggressive-lightbox-content">
				<a class="aggressive-lightbox-next-link" href="#" aria-label="Next Image">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 407.436 407.436">
						<polygon points="112.814,0 91.566,21.178 273.512,203.718 91.566,386.258 112.814,407.436 315.869,203.718"></polygon>
					</svg>
				</a>
				<a class="aggressive-lightbox-previous-link" href="#" aria-label="Previous Image">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 404.258 404.258">
						<polygon points="289.927,18 265.927,0 114.331,202.129 265.927,404.258 289.927,386.258 151.831,202.129 "></polygon>
					</svg>
				</a>
				<ul class="aggressive-lightbox-gallery">
					<li class="aggressive-lightbox-gallery-item gallery-item-current">
						<img src="https://laartsonline.com/wp-content/uploads/2024/07/thumbnail-8-1.jpg" loading="lazy">
					</li>
				</ul>
		</section>
		HTML;
	}

	add_action( 'wp_footer', 'laao_render_event_gallery_lightbox' );
}

?>

<div data-wp-interactive="laao/event-gallery">
	<p data-wp-on--click='actions.handleClick'>Click this div to toggle the lightbox.</p>
</div>
