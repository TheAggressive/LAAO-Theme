<?php
/**
 * Autoloader
 *
 * Maps the LAAO namespace onto the theme's WordPress-style file names
 * (LAAO\Core\Theme_Support => inc/Core/class-theme-support.php).
 *
 * The released theme ships without vendor/, so this — not Composer — is the
 * production autoloader. It is required directly by functions.php and must not
 * depend on anything that is itself autoloaded.
 *
 * No ABSPATH guard: this file also loads under PHPUnit and WP-CLI, where that
 * constant may not be defined.
 *
 * @package LAAO
 */

namespace LAAO;

/**
 * PSR-4-style autoloader for WordPress file naming.
 *
 * @since 1.0.0
 */
class Autoloader {

	/**
	 * Namespace prefix this autoloader is responsible for.
	 *
	 * @var string
	 */
	private string $namespace = 'LAAO';

	/**
	 * Absolute path to the directory the namespace maps onto.
	 *
	 * @var string
	 */
	private string $base_dir;

	/**
	 * Registers the autoloader with SPL.
	 */
	public function __construct() {
		$this->base_dir = __DIR__ . '/';
		spl_autoload_register( array( $this, 'autoload' ) );
	}

	/**
	 * Resolves a class name to a file and loads it.
	 *
	 * @param string $class_name Fully-qualified class name.
	 * @return void
	 */
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
