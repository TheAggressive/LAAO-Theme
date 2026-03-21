<?php

namespace LAAO;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Service_Container {

	private array $services  = array();
	private array $instances = array();

	public function register( string $key, callable $factory ): void {
		$this->services[ $key ] = $factory;
	}

	public function get( string $key ): mixed {
		if ( isset( $this->instances[ $key ] ) ) {
			return $this->instances[ $key ];
		}

		if ( ! isset( $this->services[ $key ] ) ) {
			throw new \InvalidArgumentException( "Service '{$key}' not registered." );
		}

		$this->instances[ $key ] = ( $this->services[ $key ] )( $this );

		return $this->instances[ $key ];
	}

	public function has( string $key ): bool {
		return isset( $this->services[ $key ] );
	}
}
