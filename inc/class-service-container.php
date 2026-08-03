<?php
/**
 * Service Container
 *
 * Minimal lazy singleton registry used by Bootstrap. Deliberately small: it
 * resolves nothing automatically and has no reflection, so the wiring stays
 * explicit and greppable.
 *
 * @package LAAO
 */

namespace LAAO;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lazy service registry.
 *
 * Every service is a singleton: the factory runs once and the instance is
 * cached for every later get() call.
 */
class Service_Container {

	/**
	 * Registered factories, keyed by service name.
	 *
	 * @var array<string, callable>
	 */
	private array $services = array();

	/**
	 * Instances already built, keyed by service name.
	 *
	 * @var array<string, mixed>
	 */
	private array $instances = array();

	/**
	 * Registers a factory for a service.
	 *
	 * @param string   $key     Service name.
	 * @param callable $factory Receives the container, returns the service.
	 * @return void
	 */
	public function register( string $key, callable $factory ): void {
		$this->services[ $key ] = $factory;
	}

	/**
	 * Resolves a service, building it on first request.
	 *
	 * @param string $key Service name.
	 * @return mixed The service instance.
	 * @throws \InvalidArgumentException If no factory is registered for $key.
	 */
	public function get( string $key ): mixed {
		if ( isset( $this->instances[ $key ] ) ) {
			return $this->instances[ $key ];
		}

		if ( ! isset( $this->services[ $key ] ) ) {
			throw new \InvalidArgumentException( esc_html( "Service '{$key}' not registered." ) );
		}

		$this->instances[ $key ] = ( $this->services[ $key ] )( $this );

		return $this->instances[ $key ];
	}

	/**
	 * Whether a factory is registered under this name.
	 *
	 * @param string $key Service name.
	 * @return bool
	 */
	public function has( string $key ): bool {
		return isset( $this->services[ $key ] );
	}
}
