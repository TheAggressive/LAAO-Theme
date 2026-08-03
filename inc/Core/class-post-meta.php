<?php
/**
 * Post Meta
 *
 * Registers the theme's editorial meta fields and keeps the Highlight Posts
 * cache in step with them.
 *
 * Every field is registered with show_in_rest so the block editor sidebar
 * panels can read and write it, and with an edit_post capability check so the
 * REST route cannot be used to write meta on a post the user cannot edit.
 *
 * @package LAAO
 */

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers editorial post meta and its cache invalidation.
 */
class Post_Meta {

	/**
	 * Post types carrying the editorial meta group.
	 *
	 * @var string[]
	 */
	private array $editorial_post_types;

	/**
	 * Post types carrying the cover meta group.
	 *
	 * @var string[]
	 */
	private array $cover_post_type;

	/**
	 * Post types carrying the What's Hot meta group.
	 *
	 * @var string[]
	 */
	private array $wh_post_types;

	/**
	 * Constructor.
	 *
	 * @param string[] $editorial_post_types Post types for the editorial group.
	 * @param string[] $cover_post_type      Post types for the cover group.
	 * @param string[] $wh_post_types        Post types for the What's Hot group.
	 */
	public function __construct( array $editorial_post_types, array $cover_post_type, array $wh_post_types ) {
		$this->editorial_post_types = $editorial_post_types;
		$this->cover_post_type      = $cover_post_type;
		$this->wh_post_types        = $wh_post_types;
	}

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'init', array( $this, 'register' ) );
		add_action( 'updated_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
		add_action( 'added_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
		add_action( 'deleted_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
		add_action( 'transition_post_status', array( $this, 'clear_on_status_change' ), 10, 3 );
		// When the standard REST save sends an empty string for a highlight date,
		// delete the meta row instead of storing '' so the deleted_post_meta
		// action fires and DB stays clean.
		add_filter( 'pre_update_post_metadata', array( $this, 'delete_highlight_meta_if_empty' ), 10, 4 );
		// Hide highlight date keys from the Classic Custom Fields meta box so
		// clicking Save/Update does not submit stale values through the classic
		// meta box pathway and overwrite what the block editor panel saved.
		add_filter( 'is_protected_meta', array( $this, 'protect_highlight_date_meta' ), 10, 2 );
	}

	/**
	 * Registers every meta field, grouped by the post types that use it.
	 *
	 * @return void
	 */
	public function register(): void {
		$this->register_group(
			array(
				'by_options'              => 'By Options',
				'author'                  => 'Author',
				'photo_credits_types'     => 'Photo Credits Types',
				'photo_credit_belongs_to' => 'Photo Credits Belongs To',
				'picture_id'              => 'Picture ID',
				'location'                => 'Location',
				'hair_by'                 => 'Hair By',
				'make_up_by'              => 'Make Up By',
				'grooming_by'             => 'Grooming By',
				'highlight_start_date'    => 'Highlight Start Date',
				'highlight_end_date'      => 'Highlight End Date',
			),
			$this->editorial_post_types
		);

		$this->register_group(
			array(
				'photo_2' => 'Photo 2',
				'photo_3' => 'Photo 3',
			),
			$this->cover_post_type
		);

		$this->register_group(
			array(
				'wh_link_to'      => 'Link To',
				'wh_picture_id'   => 'Picture ID',
				'wh_photo_credit' => 'Photo Credit',
			),
			$this->wh_post_types
		);
	}

	/**
	 * Invalidates the highlight cache when a scheduled post changes status.
	 *
	 * Publishing or unpublishing a post changes which highlights are eligible,
	 * even though no meta value moved.
	 *
	 * @param string   $new_status Status being transitioned to.
	 * @param string   $old_status Status being transitioned from.
	 * @param \WP_Post $post       Post being transitioned.
	 * @return void
	 */
	public function clear_on_status_change( string $new_status, string $old_status, \WP_Post $post ): void {
		if ( $new_status === $old_status ) {
			return;
		}

		// Only care about posts that have highlight dates set.
		if ( ! get_post_meta( $post->ID, 'highlight_start_date', true ) && ! get_post_meta( $post->ID, 'highlight_end_date', true ) ) {
			return;
		}

		$this->delete_all_highlight_transients();
	}

	/**
	 * Invalidates the highlight cache when a highlight date is written.
	 *
	 * @param mixed  $meta_id  Meta row ID (unused; required by the hook signature).
	 * @param int    $post_id  Post the meta belongs to.
	 * @param string $meta_key Meta key that changed.
	 * @return void
	 */
	public function clear_highlight_transients( mixed $meta_id, int $post_id = 0, string $meta_key = '' ): void {
		if ( ! in_array( $meta_key, array( 'highlight_start_date', 'highlight_end_date' ), true ) ) {
			return;
		}

		$this->delete_all_highlight_transients();
	}

	/**
	 * Mark highlight date keys as protected so they are hidden from the Classic
	 * Custom Fields meta box. Without this, the classic save pathway submits
	 * the stale values shown in the meta box and overwrites the block editor save.
	 *
	 * @param bool   $is_protected Whether the meta key is protected.
	 * @param string $meta_key     The meta key.
	 * @return bool Whether the meta key should be treated as protected.
	 */
	public function protect_highlight_date_meta( bool $is_protected, string $meta_key ): bool {
		if ( in_array( $meta_key, array( 'highlight_start_date', 'highlight_end_date' ), true ) ) {
			return true;
		}
		return $is_protected;
	}

	/**
	 * Intercept update_post_meta calls for highlight date keys.
	 * When the value is empty, delete the row instead of storing ''.
	 * Returning non-null short-circuits the normal update path.
	 *
	 * @param mixed  $check     null to proceed normally, non-null to short-circuit.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Meta key being updated.
	 * @param mixed  $meta_value New value.
	 */
	public function delete_highlight_meta_if_empty( mixed $check, int $object_id, string $meta_key, mixed $meta_value ): mixed {
		if ( ! in_array( $meta_key, array( 'highlight_start_date', 'highlight_end_date' ), true ) ) {
			return $check;
		}

		if ( '' === (string) $meta_value ) {
			delete_post_meta( $object_id, $meta_key );
			return true; // Short-circuit: tell update_post_meta we handled it.
		}

		return $check; // null — proceed with normal update.
	}

	/**
	 * Invalidates every cached Highlight Posts render.
	 *
	 * Advances the cache generation rather than deleting rows by name pattern —
	 * see LAAO\Core\Cache_Version for why the pattern delete was wrong.
	 *
	 * @return void
	 */
	private function delete_all_highlight_transients(): void {
		Cache_Version::bump( 'highlight_posts' );
	}

	/**
	 * Registers one group of meta keys across a set of post types.
	 *
	 * @param array<string, string> $fields     Map of meta key => human label.
	 * @param string[]              $post_types Post types to register them on.
	 * @return void
	 */
	private function register_group( array $fields, array $post_types ): void {
		$auth = function ( $allowed, $meta_key, $post_id ) {
			return current_user_can( 'edit_post', $post_id );
		};

		foreach ( $fields as $key => $title ) {
			foreach ( $post_types as $post_type ) {
				register_post_meta(
					$post_type,
					$key,
					array(
						'show_in_rest'  => true,
						'title'         => $title,
						'description'   => '',
						'single'        => true,
						'type'          => 'string',
						'auth_callback' => $auth,
					)
				);
			}
		}
	}
}
