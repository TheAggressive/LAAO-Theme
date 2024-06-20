<?php

class LAAO_Setup {
	public function __construct() {
		add_action( 'after_setup_theme', array( $this, 'theme_supports' ) );
		add_action( 'init', array( $this, 'register_post_types' ) );
		add_action( 'init', array( $this, 'register_taxonomies' ) );
		add_action( 'init', array( $this, 'register_post_meta' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_style' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'after_setup_theme', array( $this, 'add_editor_styles' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );

		add_filter( 'xmlrpc_enabled', '__return_false' );
		add_filter( 'jetpack_sharing_counts', '__return_false', 99 );
		add_filter( 'jetpack_implode_frontend_css', '__return_false', 99 );

		// Remove Rank Math SEO Tags
		add_filter( 'rank_math/frontend/remove_credit_notice', '__return_true' );

		// Remove WP <head> tags
		remove_action( 'wp_head', 'wp_generator' );
		remove_action( 'wp_head', 'rsd_link' );
		remove_action( 'wp_head', 'wlwmanifest_link' );

		// Remove core block patterns.
		remove_theme_support( 'core-block-patterns' );
	}

	/** This is where you can register custom post types */
	public function register_post_types() {
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
				'supports'            => array(
					0 => 'title',
					1 => 'editor',
				),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
						3 => 'custom-fields',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'            => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'has_archive'         => true,
					'rewrite'             => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
						3 => 'custom-fields',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
					'delete_with_user' => false,
				)
			);

			register_post_type(
				'edition',
				array(
					'labels'              => array(
						'name'          => 'Editions',
						'singular_name' => 'Edition',
					),
					'public'              => true,
					'exclude_from_search' => true,
					'show_in_rest'        => true,
					'menu_position'       => 5,
					'menu_icon'           => 'dashicons-admin-post',
					'supports'            => array(
						0 => 'title',
					),
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
					'supports'            => array(
						0 => 'title',
						1 => 'editor',
					),
					'has_archive'         => true,
					'rewrite'             => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
					'delete_with_user' => false,
				)
			);

			register_post_type(
				'hero-bg',
				array(
					'labels'              => array(
						'name'          => 'Hero Image&#039;s',
						'singular_name' => 'Hero Image',
					),
					'public'              => true,
					'exclude_from_search' => true,
					'show_in_nav_menus'   => false,
					'show_in_rest'        => true,
					'menu_position'       => 10,
					'menu_icon'           => 'dashicons-images-alt2',
					'supports'            => array(
						0 => 'title',
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'            => array(
						0 => 'title',
						1 => 'editor',
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'         => array(
						0 => 'title',
						1 => 'editor',
						2 => 'thumbnail',
					),
					'taxonomies'       => array(
						0 => 'post_tag',
					),
					'has_archive'      => true,
					'rewrite'          => array(
						'feeds' => false,
					),
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
					'supports'            => array(
						0 => 'title',
						1 => 'editor',
					),
					'has_archive'         => true,
					'rewrite'             => array(
						'feeds' => false,
					),
					'delete_with_user'    => false,
				)
			);

			register_post_type(
				'wh_cover',
				array(
					'labels'              => array(
						'name'          => 'What&amp;#39;s Hot Cover',
						'singular_name' => 'What&amp;#39;s Hot Cover',
					),
					'public'              => true,
					'exclude_from_search' => true,
					'show_in_rest'        => true,
					'menu_position'       => 40,
					'menu_icon'           => 'dashicons-star-filled',
					'supports'            => array(
						0 => 'title',
						1 => 'thumbnail',
					),
					'can_export'          => false,
					'delete_with_user'    => false,
				)
			);
	}

	/** This is where you can register custom taxonomies. */
	public function register_taxonomies() {
	}

	/** This is where you can register custom taxonomies. */
	public function register_post_meta() {
		$cover_post_type      = array( 'cover' );
		$editorial_post_types = array( 'cover', 'arts', 'theatre', 'film', 'television', 'extra', 'music', 'spotlight', 'dining', 'events' );
		$wh_post_types        = array( 'wh_cover' );

		$editorial_meta = array(
			array(
				'id'      => 'by_options',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'By Options',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),
			),
			array(
				'id'      => 'author',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Author',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),
			),
			array(
				'id'      => 'photo_credits_types',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Photo Credits Types',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),

			),
			array(
				'id'      => 'photo_credit_belongs_to',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Photo Credits Types',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),

			),
			array(
				'id'      => 'picture_id',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Picture ID',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),

			),
			array(
				'id'      => 'location',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Location',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),

			),
			array(
				'id'      => 'hair_by',                   // Meta box ID
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),                                              // Array of post types where the meta box should appear
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Hair By',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),

			),
			array(
				'id'      => 'make_up_by',                 // Meta box ID
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Make Up By',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),
			),
			array(
				'id'      => 'grooming_by',
				'screens' => array(
					'cover',
					'arts',
					'theatre',
					'film',
					'television',
					'extra',
					'music',
					'spotlight',
					'dining',
					'events',
				),
				'args'    => array(
					'show_in_rest'  => true,
					'title'         => 'Grooming By',
					'description'   => '',
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => function () {
						return current_user_can( 'edit_pages' );
					},
				),
			),
		);

		// Loop through each meta box configuration
		foreach ( $editorial_meta as $meta_box ) {
			foreach ( $meta_box['screens'] as $screen ) {
				register_post_meta( $screen, $meta_box['id'], $meta_box['args'] );
			}
		}
	}

	public function theme_supports() {
		// Add default posts and comments RSS feed links to head.
		add_theme_support( 'automatic-feed-links' );

		/*
		 * Let WordPress manage the document title.
		 * By adding theme support, we declare that this theme does not use a
		 * hard-coded <title> tag in the document head, and expect WordPress to
		 * provide it for us.
		 */
		add_theme_support( 'title-tag' );

		/*
		 * Enable support for Post Thumbnails on posts and pages.
		 *
		 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		 */
		add_theme_support( 'post-thumbnails' );

		/*
		 * Switch default core markup for search form, comment form, and comments
		 * to output valid HTML5.
		 */
		add_theme_support(
			'html5',
			array(
				'comment-list',
				'comment-form',
				'search-form',
				'gallery',
				'caption',
				'style',
				'script',
			)
		);

		/*
		 * Enable support for Post Formats.
		 *
		 * See: https://codex.wordpress.org/Post_Formats
		 */
		add_theme_support(
			'post-formats',
			array(
				'aside',
				'image',
				'video',
				'status',
				'quote',
				'link',
				'gallery',
				'audio',
				'chat',
			)
		);

		// Add support for menus
		add_theme_support( 'menus' );

		// Add support for Block Styles.
		add_theme_support( 'wp-block-styles' );

		// Add support for editor styles.
		add_theme_support( 'editor-styles' );

		add_editor_style( 'dist/styles/editor.css' );

		// Add support for responsive embedded content.
		add_theme_support( 'responsive-embeds' );
	}

	//  Register Style(s)
	public function register_style() {

		// Deregister/dequeue adsanity css
		wp_dequeue_style( 'adsanity-default-css' );
		wp_deregister_style( 'adsanity-default-css' );
		wp_dequeue_style( 'adsanity-cas' );
		wp_deregister_style( 'adsanity-cas' );
	}

	//  Enqueue Style(s)
	public function enqueue_style() {
		wp_enqueue_style(
			'laartsonline',
			get_template_directory_uri() . '/dist/styles/app.css',
			array(),
			wp_get_theme()->get( 'Version' ),
			'screen',
		);
	}

	// Enqueue Script(s)
	public function enqueue_scripts() {
		wp_enqueue_script(
			'laartsonline-app',
			get_template_directory_uri() . '/dist/scripts/app.js',
			array(),
			wp_get_theme()->get( 'Version' ),
			true,
		);

		wp_enqueue_script(
			'gsap-js',
			'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js',
			array(),
			'3.11.3',
			true
		);

		wp_enqueue_script(
			'gsap-scrolltrigger-js',
			'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/ScrollTrigger.min.js',
			array(),
			'3.11.3',
			true
		);

		wp_enqueue_script(
			'lenissmoothscroll-js',
			'https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js',
			array(),
			'1.0.29',
			true
		);
		wp_enqueue_script(
			'laartsonline-gsap-js',
			get_template_directory_uri() . '/dist/scripts/gsap.js',
			array( 'gsap-js' ),
			wp_get_theme()->get( 'Version' ),
			true,
		);
		wp_enqueue_script(
			'laartsonline-smoothscroll-js',
			get_template_directory_uri() . '/dist/scripts/smoothscroll.js',
			array( 'lenissmoothscroll-js' ),
			wp_get_theme()->get( 'Version' ),
			true,
		);
	}

	public function defer_parsing_of_js( $url ) {
		$no_defer_list = array(
			'jquery.min.js',
			'jquery.js',
			'i18n.min.js',
			'i18n.js',
			'a11y.min.js',
			'a11y.js',
			'dom-ready.min.js',
			'dom-ready.js',
			'wp-polyfill.min.js',
			'wp-polyfill.js',
			'hooks.min.js',
			'hooks.js',
			'wp-embed.min.js',
			'wp-embed.js',
			'index.js',
		);

		foreach ( $no_defer_list as $val ) {
			if ( strpos( $url, $val ) ) {
				return $url;
			}
		}

		if ( is_user_logged_in() ) {
			return $url;
		} //don't break WP Admin
		if ( false === strpos( $url, '.js' ) ) {
			return $url;
		}
		return str_replace( ' src', ' defer src', $url );
	}

	public function add_editor_styles() {
		add_editor_style( 'dist/styles/editor.css' );
	}

	public function register_block_types() {
		$build_dir = get_stylesheet_directory() . '/dist/blocks';

		foreach ( scandir( $build_dir ) as $result ) {
			$block_location = $build_dir . '/' . $result;

			if ( ! is_dir( $block_location ) || '.' === $result || '..' === $result ) {
				continue;
			}

			register_block_type( $block_location );
		}
	}
}
