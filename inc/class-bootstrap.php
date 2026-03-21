<?php

namespace LAAO;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Bootstrap {

	private static ?Bootstrap $instance = null;
	private Service_Container $container;

	private array $editorial_post_types = array( 'cover', 'arts', 'theatre', 'film', 'television', 'extra', 'music', 'spotlight', 'dining', 'events' );
	private array $cover_post_type      = array( 'cover' );
	private array $wh_post_types        = array( 'wh_cover' );

	public static function get_instance(): Bootstrap {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->container = new Service_Container();
		$this->register_services();
		$this->init_services();
	}

	private function register_services(): void {
		$editorial = $this->editorial_post_types;
		$cover     = $this->cover_post_type;
		$wh        = $this->wh_post_types;

		$this->container->register( 'theme_support', fn() => new Core\Theme_Support() );
		$this->container->register( 'post_types', fn() => new Core\Post_Types() );
		$this->container->register( 'post_meta', fn() => new Core\Post_Meta( $editorial, $cover, $wh ) );
		$this->container->register( 'block_types', fn() => new Core\Block_Types() );
		$this->container->register( 'theme_updates', fn() => new Core\Theme_Updates() );
		$this->container->register( 'styles', fn() => new Assets\Styles() );
		$this->container->register( 'scripts', fn() => new Assets\Scripts( $editorial, $cover, $wh ) );
		$this->container->register( 'highlight_columns', fn() => new Editorial\Highlight_Columns( $editorial ) );
	}

	private function init_services(): void {
		$this->container->get( 'theme_support' )->init();
		$this->container->get( 'post_types' )->init();
		$this->container->get( 'post_meta' )->init();
		$this->container->get( 'block_types' )->init();
		$this->container->get( 'theme_updates' )->init();
		$this->container->get( 'styles' )->init();
		$this->container->get( 'scripts' )->init();
		$this->container->get( 'highlight_columns' )->init();
	}
}
