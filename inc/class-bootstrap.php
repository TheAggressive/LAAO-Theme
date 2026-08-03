<?php
/**
 * Bootstrap
 *
 * Composition root for the theme. Every service is registered against the
 * container here and initialised in one place, so the set of things the theme
 * does is readable from a single file.
 *
 * @package LAAO
 */

namespace LAAO;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and initialises every theme service.
 */
class Bootstrap {

	/**
	 * Singleton instance.
	 *
	 * @var Bootstrap|null
	 */
	private static ?Bootstrap $instance = null;

	/**
	 * Service container holding every registered service.
	 *
	 * @var Service_Container
	 */
	private Service_Container $container;

	/**
	 * Post types that carry editorial highlight scheduling.
	 *
	 * @var string[]
	 */
	private array $editorial_post_types = array( 'cover', 'arts', 'theatre', 'film', 'television', 'extra', 'music', 'spotlight', 'dining', 'events' );

	/**
	 * Post types treated as magazine covers.
	 *
	 * @var string[]
	 */
	private array $cover_post_type = array( 'cover' );

	/**
	 * Post types backing the What's Hot module.
	 *
	 * @var string[]
	 */
	private array $wh_post_types = array( 'wh_cover' );

	/**
	 * Returns the shared instance, creating it on first call.
	 *
	 * @return Bootstrap
	 */
	public static function get_instance(): Bootstrap {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Builds the container and starts every service.
	 */
	private function __construct() {
		$this->container = new Service_Container();
		$this->register_services();
		$this->init_services();
	}

	/**
	 * Registers each service factory against the container.
	 *
	 * Factories are lazy: nothing is constructed until init_services() asks
	 * for it.
	 *
	 * @return void
	 */
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

	/**
	 * Initialises every registered service.
	 *
	 * Order matters: theme support and post types must be in place before the
	 * services that hook onto them.
	 *
	 * @return void
	 */
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
