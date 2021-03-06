/**
 * Prometheus 2.
 *
 * This file adds Gulp tasks to the Prometheus 2 theme.
 *
 * @author Christoph Herr
 */

// Set up dependencies.
const arg = require( './js/tooling/gulp-fetch-cl-arguments' ).arg;
const autoprefixer = require( 'autoprefixer' );
const browserSync = require( 'browser-sync' );
const bump = require( 'gulp-bump' );
const cache = require( 'gulp-cached' );
const cleancss = require( 'gulp-clean-css' );
const del = require( 'del' );
const fs = require( 'fs' );
const gulp = require( 'gulp' );
const imagemin = require( 'gulp-imagemin' );
const minify = require( 'gulp-minify' );
const mqpacker = require( 'css-mqpacker' );
const notify = require( 'gulp-notify' );
const pixrem = require( 'gulp-pixrem' );
const plumber = require( 'gulp-plumber' );
const postcss = require( 'gulp-postcss' );
const prettierEslint = require( 'gulp-prettier-eslint' );
const rename = require( 'gulp-rename' );
const sass = require( 'gulp-sass' );
const sassLint = require( 'gulp-sass-lint' );
const sortCSSmq = require( 'sort-css-media-queries' );
const sourcemaps = require( 'gulp-sourcemaps' );
const styleLint = require( 'gulp-stylelint' );

/**
 * Error handling
 *
 * @function
 */
function handleErrors() {
	const args = Array.prototype.slice.call( arguments );

	notify
		.onError({
			title: 'Task Failed [<%= error.message %>]',
			message: '<%= error %> - See console or enable logging in the plugin.'
		})
		.apply( this, args );

	// Prevent the 'watch' task from stopping
	this.emit( 'end' );
}

/*************
 * CSS Tasks
 ************/

/**
 * PostCSS Task Handler
 */
gulp.task( 'postcss', () => {
	gulp
		.src( './scss/style.scss' )

		// Error handling.
		.pipe(
			plumber({
				errorHandler: handleErrors
			})
		)

		// Wrap tasks in a sourcemap.
		.pipe( sourcemaps.init() )

		// Sass magic.
		.pipe(
			sass({
				errLogToConsole: true,
				outputStyle: 'expanded' // Options: nested, expanded, compact, compressed
			})
		)

		// Pixel fallbacks for rem units.
		.pipe( pixrem() )

		// PostCSS magic.
		.pipe(
			postcss([
				autoprefixer(),
				mqpacker({
					sort: true
				}),
				require( 'styleLint' )({
					fix: true
				})
			])
		)

		// Create the source map.
		.pipe(
			sourcemaps.write( './', {
				includeContent: false
			})
		)

		// Write the CSS file.
		.pipe( gulp.dest( './' ) )

		// Inject CSS into Browser.
		.pipe( browserSync.stream() );
});

/**
 * Minify style.css
 */
gulp.task( 'css:minify', [ 'postcss' ], () => {
	gulp
		.src( './style.css' )

		// Error handling.
		.pipe(
			plumber({
				errorHandler: handleErrors
			})
		)

		// Combine similar rules and minify styles.
		.pipe(
			cleancss({
				level: {
					1: {
						specialComments: 0
					},
					2: {
						all: true
					}
				}
			})
		)

		// Rename the file.
		.pipe( rename( 'style.min.css' ) )

		// Write the file.
		.pipe( gulp.dest( './' ) )

		// Inject the CSS into the browser.
		.pipe( browserSync.stream() )

		.pipe(
			notify({
				message: 'Styles are built.'
			})
		);
});

/**
 * Lint Scss files.
 */
gulp.task( 'sass:lint', [ 'css:minify' ], () => {
	gulp
		.src([ './scss/style.scss', '!./scss/resets/index.scss' ])
		.pipe(
			sassLint({
				rules: {
					quotes: {
						style: 'double'
					}
				}
			})
		)
		.pipe( sassLint.format() )
		.pipe( sassLint.failOnError() );
});

gulp.task( 'woocommerce', () => {
	gulp
		.src( './lib/plugins/woocommerce/scss/prometheus2-woocommerce.scss' )

		// Error handling.
		.pipe(
			plumber({
				errorHandler: handleErrors
			})
		)

		// Wrap tasks in a sourcemap.
		.pipe( sourcemaps.init() )

		// Sass magic.
		.pipe(
			sass({
				errLogToConsole: true,
				outputStyle: 'expanded' // Options: nested, expanded, compact, compressed
			})
		)

		// Pixel fallbacks for rem units.
		.pipe( pixrem({ rootValue: '10px' }) )

		// PostCSS magic.
		.pipe(
			postcss([
				autoprefixer(),
				mqpacker({
					sort: sortCSSmq.desktopFirst
				}),
				require( 'styleLint' )({
					fix: true
				})
			])
		)

		// Create the source map.
		.pipe(
			sourcemaps.write( './', {
				includeContent: false
			})
		)

		.pipe( gulp.dest( './lib/plugins/woocommerce/' ) );
});

gulp.task( 'wc:minify', [ 'woocommerce' ], () => {
	gulp
		.src( './lib/plugins/woocommerce/prometheus2-woocommerce.css' )

		// Error handling.
		.pipe(
			plumber({
				errorHandler: handleErrors
			})
		)

		// Combine similar rules and minify styles.
		.pipe(
			cleancss({
				level: {
					1: {
						specialComments: 0
					},
					2: {
						all: true
					}
				}
			})
		)

		.pipe( rename( 'prometheus2-woocommerce.min.css' ) )

		.pipe( gulp.dest( './lib/plugins/woocommerce/' ) )

		.pipe(
			notify({
				message: 'Styles are built.'
			})
		);
});

gulp.task( 'wc:lint', [ 'wc:minify' ], () => {
	gulp
		.src( './lib/plugins/woocommerce/scss/prometheus2-woocommerce.scss' )
		.pipe(
			sassLint({
				rules: {
					quotes: {
						style: 'double'
					}
				}
			})
		)
		.pipe( sassLint.format() )
		.pipe( sassLint.failOnError() );
});

/*******************
 * JavaScript Tasks
 *******************/

/**
 * JavaScript Task Handler.
 */
gulp.task( 'js', () => {
	gulp
		.src([ '!./js/*.min.js', './js/*.js' ])

		// Error handling.
		.pipe(
			plumber({
				errorHandler: handleErrors
			})
		)

		// Linting and Pretty Printing.
		.pipe( prettierEslint() )

		// Minify JavaScript.
		.pipe(
			minify({
				ext: {
					src: '.js',
					min: '.min.js'
				},
				noSource: true
			})
		)
		.pipe( gulp.dest( 'js' ) )

		// Inject changes via browserSync.
		.pipe(
			browserSync.reload({
				stream: true
			})
		)

		.pipe(
			notify({
				message: 'Scripts are minified.'
			})
		);
});

/************************
 * Optimize theme images
 ***********************/
gulp.task( 'images', () => {
	return (
		gulp
			.src( './images/*' )

			// Error handling.
			.pipe(
				plumber({
					errorHandler: handleErrors
				})
			)

			// Cache files to avoid processing files that haven't changed.
			.pipe( cache( 'images' ) )

			// Optimize images.
			.pipe(
				imagemin([
					imagemin.gifsicle({ interlaced: true }),
					imagemin.jpegtran({ progressive: true }),
					imagemin.optipng({ optimizationLevel: 5 }),
					imagemin.svgo({
						plugins: [ { removeViewBox: true }, { cleanupIDs: false } ]
					})
				])
			)

			// Output the optimized images to this directory.
			.pipe( gulp.dest( './images/' ) )

			// Inject changes via browsersync.
			.pipe(
				browserSync.reload({
					stream: true
				})
			)

			.pipe(
				notify({
					message: 'Images are optimized.'
				})
			)
	);
});

/********************************************
 * Bump theme version.
 *
 * Usage:
 *  gulp bump --major -> from 1.0.0 to 2.0.0
 *  gulp bump --minor -> from 1.0.0 to 1.1.0
 *  gulp bump --patch -> from 1.0.0 to 1.0.1
 *
 * The theme version in PHP is updated
 * automatically from the stylesheet.
 *******************************************/
gulp.task( 'bump', () => {
	let versionbump;

	if ( arg.major ) {
		versionBump = 'major';
	}

	if ( arg.minor ) {
		versionBump = 'minor';
	}

	if ( arg.patch ) {
		versionBump = 'patch';
	}

	gulp
		.src([ './package.json', './composer.json', './style.css' ])
		.pipe(
			bump({
				type: versionBump
			})
		)
		.pipe( gulp.dest( './' ) );

	gulp
		.src( './scss/style.scss' )
		.pipe(
			bump({
				type: versionBump
			})
		)
		.pipe( gulp.dest( './scss/' ) );
});

/**********************
 * All Tasks Listeners
 *********************/

const siteName = 'genesis.test';

gulp.task( 'watch', () => {

	// HTTPS (optional).
	browserSync({
		proxy: `http://${siteName}`,
		host: siteName,
		port: 8000,
		notify: false,
		open: 'external',
		browser: 'chrome'

		// https: {
		// 	key: 'path/to/your/key/file/genesis.key',
		// 	cert: `path/to/your/cert/file/${siteName}.crt`
		// }
	});

	// Watch Scss files. Changes are injected into the browser from within the task.
	gulp.watch( './scss/**/*.scss', [ 'styles' ]);

	// Watch JavaScript files. Changes are injected into the browser from within the task.
	gulp.watch([ './js/*.js', '!./js/*.min.js' ], [ 'scripts' ]);

	// Watch Image files. Changes are injected into the browser from within the task.
	gulp.watch( './images/*', [ 'images' ]);

	// Watch PHP files and reload the browser if there is a change. Add directories if needed.
	gulp
		.watch([
			'./*.php',
			'./config/*.php',
			'./lib/*.php',
			'./lib/**/*.php',
			'./lib/**/**/*.php'
		])
		.on( 'change', browserSync.reload );
});

/********************
 * Individual tasks.
 *******************/
gulp.task( 'scripts', [ 'js' ]);
gulp.task( 'styles', [ 'sass:lint' ]);
gulp.task( 'wc-styles', [ 'wc:lint' ]);

gulp.task( 'default', [ 'watch' ], () => {
	gulp.start( 'styles', 'scripts', 'images' );
});
