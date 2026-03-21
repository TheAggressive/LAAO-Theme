import wpConfig from '@wordpress/scripts/config/webpack.config.js';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import fg from 'fast-glob';
import path from 'path';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';

function toPosix( p ) {
	return p.split( '\\' ).join( '/' );
}

function buildEntries() {
	const cwd = process.cwd();
	const entries = {};

	// Scripts: src/scripts/*.js -> dist/scripts/*.js
	fg.sync( 'src/scripts/*.js', { cwd } ).forEach( ( file ) => {
		const name = toPosix( path.basename( file, path.extname( file ) ) );
		entries[ `scripts/${ name }` ] = path.resolve( cwd, file );
	} );

	// Styles: src/styles/*.css -> dist/styles/*.css
	// Excludes partials (files prefixed with _)
	fg.sync( 'src/styles/*.css', { cwd, ignore: [ 'src/styles/_*.css' ] } ).forEach( ( file ) => {
		const name = toPosix( path.basename( file, path.extname( file ) ) );
		entries[ `styles/${ name }` ] = path.resolve( cwd, file );
	} );

	return entries;
}

export default ( env = {}, argv = {} ) => {
	const base = typeof wpConfig === 'function' ? wpConfig( env, argv ) : wpConfig;
	const template = Array.isArray( base ) ? base[ 0 ] : base;
	const isProduction = argv.mode === 'production';

	return {
		...template,
		name: 'assets',
		entry: buildEntries(),
		output: {
			path: path.resolve( process.cwd(), 'dist' ),
			filename: '[name].js',
			chunkFilename: '[name].js',
			publicPath: '',
			clean: false,
		},
		optimization: {
			splitChunks: false,
			runtimeChunk: false,
			concatenateModules: true,
			chunkIds: 'named',
			moduleIds: 'named',
		},
		plugins: [
			// Keep all WP plugins except CleanWebpackPlugin — it would wipe dist/blocks* dirs
			// built by the other webpack configs. MiniCssExtractPlugin must be kept because
			// its loader is bound to WP's specific plugin instance.
			...( template.plugins || [] ).filter(
				( p ) => p.constructor?.name !== 'CleanWebpackPlugin'
			),
			new RemoveEmptyScriptsPlugin( {
				stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
			} ),
			new CopyPlugin( {
				patterns: [
					{ from: './src/assets', to: 'assets', noErrorOnMissing: true },
					{ from: './src/block-variations', to: 'block-variations', noErrorOnMissing: true },
				],
			} ),
			// Only run BrowserSync in watch/dev mode, not during production builds
			...( ! isProduction
				? [
						new BrowserSyncPlugin( {
							host: 'localhost',
							port: 3000,
							proxy: 'http://laartsonline.local',
							files: [ '**/*.css', '**/*.php', '**/*.js' ],
						} ),
				  ]
				: [] ),
		],
		stats: 'minimal',
		ignoreWarnings: [
			( warning ) =>
				warning.name === 'ModuleWarning' &&
				warning.message.includes( 'postcss-calc: Lexical error' ),
		],
		cache: false,
	};
};
