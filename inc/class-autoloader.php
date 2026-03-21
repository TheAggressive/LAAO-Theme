<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class LAAO_Autoloader {

	private string $namespace = 'LAAO';
	private string $base_dir;

	public function __construct() {
		$this->base_dir = __DIR__ . '/';
		spl_autoload_register( array( $this, 'autoload' ) );
	}

	public function autoload( string $class_name ): void {
		$len = strlen( $this->namespace );

		if ( strncmp( $this->namespace, $class_name, $len ) !== 0 ) {
			return;
		}

		$relative_class = ltrim( substr( $class_name, $len ), '\\' );
		$parts          = explode( '\\', $relative_class );
		$classname      = array_pop( $parts );
		$subdirs        = ! empty( $parts ) ? implode( '/', $parts ) . '/' : '';
		$filename       = 'class-' . str_replace( '_', '-', strtolower( $classname ) ) . '.php';
		$file           = $this->base_dir . $subdirs . $filename;

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
}
