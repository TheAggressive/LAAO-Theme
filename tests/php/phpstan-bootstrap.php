<?php
/**
 * PHPStan bootstrap.
 *
 * Defines the WordPress constants the theme guards on, so static analysis sees
 * the same environment the code actually runs in. Keep this in sync with the
 * constants referenced across inc/ — a missing one shows up as an "undefined
 * constant" error rather than silently weakening analysis.
 *
 * @package LAAO
 */

defined( 'ABSPATH' ) || define( 'ABSPATH', __DIR__ . '/' );
defined( 'WP_DEBUG' ) || define( 'WP_DEBUG', false );
defined( 'SCRIPT_DEBUG' ) || define( 'SCRIPT_DEBUG', false );
