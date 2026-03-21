<?php

namespace LAAO\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Post_Types {

	public function init(): void {
		add_action( 'init', array( $this, 'register' ) );
	}

	public function register(): void {
		register_post_type(
			'announcements',
			array(
				'labels'              => array(
					'name'          => 'Announcements',
					'singular_name' => 'Announcement',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 10,
				'menu_icon'           => 'dashicons-megaphone',
				'supports'            => array( 'title', 'editor' ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'arts',
			array(
				'labels'           => array(
					'name'          => 'Arts',
					'singular_name' => 'Art',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-admin-appearance',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'contest',
			array(
				'labels'              => array(
					'name'          => 'Contests',
					'singular_name' => 'Contest',
					'menu_name'     => 'Contests',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_icon'           => 'dashicons-tickets-alt',
				'supports'            => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'has_archive'         => true,
				'rewrite'             => array( 'feeds' => false ),
				'can_export'          => false,
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'cover',
			array(
				'labels'           => array(
					'name'          => 'Cover Stories',
					'singular_name' => 'Cover Story',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-admin-home',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'dining',
			array(
				'labels'           => array(
					'name'          => 'Dining',
					'singular_name' => 'Dining',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-food',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'edition',
			array(
				'labels'              => array(
					'name'          => 'Edition',
					'singular_name' => 'Edition',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 5,
				'menu_icon'           => 'dashicons-admin-post',
				'supports'            => array( 'title' ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'events',
			array(
				'labels'              => array(
					'name'          => 'Event Photos',
					'singular_name' => 'Event Photo',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 10,
				'menu_icon'           => 'dashicons-format-image',
				'supports'            => array( 'title', 'editor', 'custom-fields' ),
				'has_archive'         => true,
				'rewrite'             => array( 'feeds' => false ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'extra',
			array(
				'labels'           => array(
					'name'          => 'Extra',
					'singular_name' => 'Extra',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-plus',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'can_export'       => false,
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'film',
			array(
				'labels'           => array(
					'name'          => 'Film',
					'singular_name' => 'Film',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-editor-video',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'hero-banners',
			array(
				'labels'              => array(
					'name'          => 'Hero Banners',
					'singular_name' => 'Hero Banner',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => true,
				'menu_position'       => 10,
				'menu_icon'           => 'dashicons-slides',
				'supports'            => array( 'editor', 'thumbnail', 'custom-fields' ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'music',
			array(
				'labels'           => array(
					'name'          => 'Music',
					'singular_name' => 'Music',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-format-audio',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'rsvp_events',
			array(
				'labels'              => array(
					'name'          => 'RSVP Events',
					'singular_name' => 'RSVP Event',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 10,
				'menu_icon'           => 'dashicons-tickets-alt',
				'supports'            => array( 'title', 'editor', 'custom-fields' ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'spotlight',
			array(
				'labels'           => array(
					'name'          => 'Spotlight',
					'singular_name' => 'Spotlight',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-lightbulb',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'television',
			array(
				'labels'           => array(
					'name'          => 'Television',
					'singular_name' => 'Television',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-desktop',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'theatre',
			array(
				'labels'           => array(
					'name'          => 'Theatre',
					'singular_name' => 'Theatre',
				),
				'public'           => true,
				'show_in_rest'     => true,
				'menu_position'    => 40,
				'menu_icon'        => 'dashicons-text-page',
				'supports'         => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
				'taxonomies'       => array( 'post_tag' ),
				'has_archive'      => true,
				'rewrite'          => array( 'feeds' => false ),
				'delete_with_user' => false,
			)
		);

		register_post_type(
			'videos',
			array(
				'labels'              => array(
					'name'          => 'Videos',
					'singular_name' => 'Video',
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 10,
				'menu_icon'           => 'dashicons-video-alt2',
				'supports'            => array( 'title', 'editor', 'custom-fields' ),
				'has_archive'         => true,
				'rewrite'             => array( 'feeds' => false ),
				'delete_with_user'    => false,
			)
		);

		register_post_type(
			'wh_cover',
			array(
				'labels'              => array(
					'name'          => "What's Hot Cover",
					'singular_name' => "What's Hot Cover",
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_rest'        => true,
				'menu_position'       => 40,
				'menu_icon'           => 'dashicons-star-filled',
				'supports'            => array( 'title', 'thumbnail', 'editor', 'custom-fields' ),
				'can_export'          => false,
				'delete_with_user'    => false,
			)
		);
	}
}
