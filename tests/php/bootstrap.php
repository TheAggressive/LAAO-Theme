<?php

// WordPress constants used by theme classes.
defined( 'ABSPATH' )       || define( 'ABSPATH', __DIR__ . '/' );
defined( 'ARRAY_A' )       || define( 'ARRAY_A', 'ARRAY_A' );
defined( 'ARRAY_N' )       || define( 'ARRAY_N', 'ARRAY_N' );
defined( 'OBJECT' )        || define( 'OBJECT', 'OBJECT' );
defined( 'MINUTE_IN_SECONDS' ) || define( 'MINUTE_IN_SECONDS', 60 );
defined( 'HOUR_IN_SECONDS' )   || define( 'HOUR_IN_SECONDS', 3600 );

require_once __DIR__ . '/../../vendor/autoload.php';

// Load the theme's custom autoloader (maps LAAO\* → inc/class-*.php).
require_once __DIR__ . '/../../inc/class-autoloader.php';
new LAAO_Autoloader();
