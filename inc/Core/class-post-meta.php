<?php

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Post_Meta {

	private array $editorial_post_types;
	private array $cover_post_type;
	private array $wh_post_types;

	public function __construct( array $editorial_post_types, array $cover_post_type, array $wh_post_types ) {
		$this->editorial_post_types = $editorial_post_types;
		$this->cover_post_type      = $cover_post_type;
		$this->wh_post_types        = $wh_post_types;
	}

	public function init(): void {
		add_action( 'init', array( $this, 'register' ) );
		add_action( 'updated_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
		add_action( 'added_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
		add_action( 'deleted_post_meta', array( $this, 'clear_highlight_transients' ), 10, 3 );
	}

	public function register(): void {
		$this->register_group(
			array(
				'by_options'             => 'By Options',
				'author'                 => 'Author',
				'photo_credits_types'    => 'Photo Credits Types',
				'photo_credit_belongs_to' => 'Photo Credits Belongs To',
				'picture_id'             => 'Picture ID',
				'location'               => 'Location',
				'hair_by'                => 'Hair By',
				'make_up_by'             => 'Make Up By',
				'grooming_by'            => 'Grooming By',
				'highlight_start_date'   => 'Highlight Start Date',
				'highlight_end_date'     => 'Highlight End Date',
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
				'wh_link_to'    => 'Link To',
				'wh_picture_id' => 'Picture ID',
				'wh_photo_credit' => 'Photo Credit',
			),
			$this->wh_post_types
		);
	}

	public function clear_highlight_transients( mixed $meta_id, int $post_id = 0, string $meta_key = '' ): void {
		if ( ! in_array( $meta_key, array( 'highlight_start_date', 'highlight_end_date' ), true ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_laao_highlight_posts_' ) . '%',
				$wpdb->esc_like( '_transient_timeout_laao_highlight_posts_' ) . '%'
			)
		);
	}

	private function register_group( array $fields, array $post_types ): void {
		$auth = function () {
			return current_user_can( 'edit_pages' );
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
