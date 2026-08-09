<?php
/**
 * Ad_Link_Labels
 *
 * Gives advertisement images, and so the links wrapping them, an accessible name.
 *
 * Adsanity renders a hosted ad as a link whose only content is the ad's
 * featured image, and the creatives are uploaded without alt text. A link
 * containing nothing but an image with `alt=""` has no accessible name at all:
 * a screen reader announces "link" and stops. axe reports it as a serious
 * `link-name` violation, and three were live on the front page when this was
 * written.
 *
 * The right fix is alt text on the creative, and this does not replace it —
 * an editor describing the ad will always beat a derived string. It is a floor,
 * so an ad uploaded without alt text degrades to the ad's own title rather than
 * to silence.
 *
 * The seam is core's own. get_the_post_thumbnail() brackets its call to
 * wp_get_attachment_image() with begin/end actions that exist, in core's words,
 * to provide "just in time" filtering of the filters inside it. Recording the
 * post between those two actions is what makes the ad's title available while
 * the image's attributes are being assembled — so this adjusts an array and
 * never parses HTML.
 *
 * @package LAAO
 * @since 1.14.0
 */

declare(strict_types=1);

namespace LAAO\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Names advertisement images rendered by the Adsanity plugin.
 */
class Ad_Link_Labels {

	/**
	 * Post type Adsanity registers for ads.
	 *
	 * @var string
	 */
	private const POST_TYPE = 'ads';

	/**
	 * Ad whose featured image is currently being rendered, or 0 when none is.
	 *
	 * @var int
	 */
	private int $current_ad = 0;

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'begin_fetch_post_thumbnail_html', array( $this, 'begin_ad' ), 10, 1 );
		add_action( 'end_fetch_post_thumbnail_html', array( $this, 'end_ad' ), 10, 1 );
		add_filter( 'wp_get_attachment_image_attributes', array( $this, 'name_ad_image' ), 10, 1 );
	}

	/**
	 * Notes that an ad's featured image is about to be rendered.
	 *
	 * @param int $post_id Post the thumbnail belongs to.
	 * @return void
	 */
	public function begin_ad( $post_id ): void {
		$post_id = (int) $post_id;

		$this->current_ad = self::POST_TYPE === get_post_type( $post_id ) ? $post_id : 0;
	}

	/**
	 * Clears the note once the image has been rendered.
	 *
	 * Runs whatever happened in between, so a filter that bailed out early
	 * cannot leave a stale ID to be applied to the next image on the page.
	 *
	 * @param int $post_id Post the thumbnail belongs to.
	 * @return void
	 */
	public function end_ad( $post_id ): void {
		unset( $post_id );

		$this->current_ad = 0;
	}

	/**
	 * Supplies alt text for an ad image that has none.
	 *
	 * Naming the image rather than the link names both: the link takes its
	 * accessible name from its content, and the image is its only content.
	 *
	 * @param array<string, string> $attr Image attributes.
	 * @return array<string, string>
	 */
	public function name_ad_image( $attr ): array {
		$attr = is_array( $attr ) ? $attr : array();

		if ( 0 === $this->current_ad ) {
			return $attr;
		}

		// Never overwrite alt text somebody wrote, including a deliberate empty
		// string on an ad that is genuinely decorative — but an ad is a link
		// here, so an empty value is far more often an omission than a choice.
		if ( isset( $attr['alt'] ) && '' !== trim( (string) $attr['alt'] ) ) {
			return $attr;
		}

		$label = $this->label_for( $this->current_ad );

		if ( '' === $label ) {
			return $attr;
		}

		$attr['alt'] = $label;

		return $attr;
	}

	/**
	 * Builds the alt text for an ad.
	 *
	 * Returns an empty string when the ad has no usable title, leaving the
	 * image exactly as the plugin rendered it. A generic "Advertisement" would
	 * satisfy the checker while telling a listener nothing, which is worse than
	 * an honest failure the audit can still see.
	 *
	 * @param int $ad_id Ad post ID.
	 * @return string
	 */
	private function label_for( int $ad_id ): string {
		$title = get_the_title( $ad_id );
		$title = is_string( $title ) ? trim( wp_strip_all_tags( $title ) ) : '';

		if ( '' === $title ) {
			return '';
		}

		return sprintf(
			/* translators: %s: the advertisement's title. */
			__( 'Advertisement: %s', 'laao' ),
			$title
		);
	}
}
