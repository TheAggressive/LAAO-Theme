<?php
/**
 * PHPUnit bootstrap.
 *
 * These are unit tests: WordPress is never loaded, and its functions are
 * mocked per-test with Brain\Monkey. Only the constants theme classes read at
 * definition time are defined here.
 *
 * @package LAAO
 */

defined( 'ABSPATH' ) || define( 'ABSPATH', __DIR__ . '/' );
defined( 'ARRAY_A' ) || define( 'ARRAY_A', 'ARRAY_A' );
defined( 'ARRAY_N' ) || define( 'ARRAY_N', 'ARRAY_N' );
defined( 'OBJECT' ) || define( 'OBJECT', 'OBJECT' );
defined( 'MINUTE_IN_SECONDS' ) || define( 'MINUTE_IN_SECONDS', 60 );
defined( 'HOUR_IN_SECONDS' ) || define( 'HOUR_IN_SECONDS', 3600 );

require_once __DIR__ . '/../../vendor/autoload.php';

// The theme's own autoloader, not Composer's — it is what runs in production,
// so exercising it here keeps the two from drifting apart.
require_once __DIR__ . '/../../inc/class-autoloader.php';

new LAAO\Autoloader();
