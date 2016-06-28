// All used modules.
var gulp = require('gulp');
var babel = require('gulp-babel');
var runSeq = require('run-sequence');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var livereload = require('gulp-livereload');
var minifyCSS = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var karma = require('karma').server;
var istanbul = require('gulp-istanbul');
var notify = require('gulp-notify');
var clean = require('gulp-clean');
var gulpsync = require('gulp-sync')(gulp);

// Development tasks
// --------------------------------------------------------------

// Live reload business.
gulp.task('reload', function () {
	livereload.reload();
});

gulp.task('reloadCSS', function () {
	return gulp.src('./public/app/style.css').pipe(livereload());
});

gulp.task('lintJS', function () {

	return gulp.src(['./browser/app/**/*.js', './server/**/*.js'])
		.pipe(plumber({
			errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
		}))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());

});

gulp.task('buildJS', ['lintJS'], function () {
	return gulp.src(['./browser/app/app.js', './browser/app/**/*.js'])
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(concat('main.js'))
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./public/app'));
});

gulp.task('lintIDB', function () {

	return gulp.src('./browser/idb/**/*.js')
		.pipe(plumber({
			errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
		}))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

gulp.task('buildIDB', ['lintIDB'], function () {
	return gulp.src('./browser/idb/**/*.js')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(concat('db.js'))
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./public/idb'));
});

//ST Additions / Modifications
gulp.task('buildCSS', function () {

	var sassCompilation = sass();
	sassCompilation.on('error', console.error.bind(console));

	return gulp.src('./browser/scss/main.scss')
		.pipe(plumber({
			errorHandler: notify.onError('SASS processing failed! Check your gulp process.')
		}))
		.pipe(sassCompilation)
		.pipe(rename('style.css'))
		.pipe(gulp.dest('./public/app'));
});

gulp.task('copyImages', function () {
	return gulp.src([
			'./browser/assets/icons/**/*.svg',
			'./browser/assets/images/**/*.jpg',
			'./browser/assets/images/**/*.png'
		], {
			base: './browser/'
		})
		.pipe(gulp.dest('./public'))
});

gulp.task('copyFonts', function () {
	return gulp.src(['./browser/assets/fonts/**/*.css'], {
			base: './browser/'
		})
		.pipe(gulp.dest('./public'))
});

gulp.task('copyHTML', function () {
	return gulp.src(['./browser/app/**/*.html'], {
			base: './browser/'
		})
		.pipe(gulp.dest('./public'))
})

gulp.task('clean', function () {
	return gulp.src(['./public/html', './public/js', './public/main.js', './public/style.css', './public/icons'], {
			read: false
		})
		.pipe(clean());
})

gulp.task('copyExtensionAssets', function () {
	return gulp.src([
		'./node_modules/angular/**/*',
		'./node_modules/angular-animate/**/*',
		'./node_modules/angular-aria/**/*',
		'./node_modules/angular-material/**/*',
		'./node_modules/angular-messages/**/*'
	], {
		base: './node_modules/'
	}).pipe(gulp.dest('./extension/lib'))
})


// Testing
// --------------------------------------------------------------

gulp.task('testServerJS', function () {
	require('babel-register');
	return gulp.src('./tests/server/**/*.js', {
		read: false
	}).pipe(mocha({
		reporter: 'spec'
	}));
});

gulp.task('testServerJSWithCoverage', function (done) {
	gulp.src('./server/**/*.js')
		.pipe(istanbul({
			includeUntested: true
		}))
		.pipe(istanbul.hookRequire())
		.on('finish', function () {
			gulp.src('./tests/server/**/*.js', {
					read: false
				})
				.pipe(mocha({
					reporter: 'spec'
				}))
				.pipe(istanbul.writeReports({
					dir: './coverage/server/',
					reporters: ['html', 'text']
				}))
				.on('end', done);
		});
});

gulp.task('testBrowserJS', function (done) {
	karma.start({
		configFile: __dirname + '/tests/browser/karma.conf.js',
		singleRun: true
	}, done);
});

// Service Worker Generation
// --------------------------------------------------------------

gulp.task('generateServiceWorker', function (callback) {
	var path = require('path');
	var swPrecache = require('sw-precache');

	var rootDir = 'public';

	//Libraries our project depends on.
	var dependencies = {
		'/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2': ['node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2'],
		'/bootstrap/dist/fonts/glyphicons-halflings-regular.woff': ['node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'],
		'/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf': ['node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf'],
		'/lodash/index.js': ['node_modules/lodash/index.js'],
		"/localforage/dist/localforage.js": ["node_modules/localforage/dist/localforage.js"],
		'/angular/angular.js': ['node_modules/angular/angular.js'],
		'/jquery/dist/jquery.js': ['node_modules/jquery/dist/jquery.js'],
		'/angular-animate/angular-animate.js': ['node_modules/angular-animate/angular-animate.js'],
		'/angular-messages/angular-messages.js': ['node_modules/angular-messages/angular-messages.js'],
		'/angular-ui-router/release/angular-ui-router.js': ['node_modules/angular-ui-router/release/angular-ui-router.js'],
		'/angular-ui-bootstrap/ui-bootstrap.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap.js'],
		'/angular-ui-bootstrap/ui-bootstrap-tpls.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js'],
		'/socket.io-client/socket.io.js': ['node_modules/socket.io-client/socket.io.js'],
		'/bootstrap/dist/css/bootstrap.css': ['node_modules/bootstrap/dist/css/bootstrap.css'],
		'/angular-material/angular-material.js': ['node_modules/angular-material/angular-material.js'],
		'/angular-aria/angular-aria.js': ['node_modules/angular-aria/angular-aria.js'],
		'/angular-material/angular-material.css': ['node_modules/angular-material/angular-material.css'],
		'/app/article-view/article-view.html': ["public/app/article-view/article-view.html"],
		'/app/articles/articles.html': ["public/app/articles/articles.html"],
		'/app/comments/comments.html"': ["public/app/comments/comments.html"],
		'/app/comments/edit-comment.html': ["public/app/comments/edit-comment.html"],
		'/app/common/dialogs/article-dialog/article-dialog.html': ["public/app/common/dialogs/article-dialog/article-dialog.html"],
		'/app/common/dialogs/category-dialog/category-dialog.html': ["public/app/common/dialogs/category-dialog/category-dialog.html"],
		'/app/common/dialogs/filing-dialog/filing-dialog.html': ["public/app/common/dialogs/filing-dialog/filing-dialog.html"],
		'/app/common/directives/articleDetailCard/detail.html': ["public/app/common/directives/articleDetailCard/detail.html"],
		'/app/common/directives/fullstack-logo/fullstack-logo.html': ["public/app/common/directives/fullstack-logo/fullstack-logo.html"],
		'/app/common/directives/navbar/navbar.html': ["public/app/common/directives/navbar/navbar.html"],
// 		'/app/common/directives/oauth-button/oauth-button.html': ["public/app/common/directives/oauth-button/oauth-button.html"],
		'/app/common/directives/rando-greeting/rando-greeting.html': ["public/app/common/directives/rando-greeting/rando-greeting.html"],
		'/app/common/directives/sections/sections-view.html': ["public/app/common/directives/sections/sections-view.html"],
		'/app/common/directives/sidebar/sidebar.html': ["public/app/common/directives/sidebar/sidebar.html"],
		'/app/common/directives/speed-dial/speed-dial.html': ["public/app/common/directives/speed-dial/speed-dial.html"],
// 		'/app/dot-menu/menu.html': ["public/app/dot-menu/menu.html"],
		'/app/folders/folders.html': ["public/app/folders/folders.html"],
		'/app/home/home.html': ["public/app/home/home.html"],
		'/app/offline/offline.html': ["public/app/offline/offline.html"],
		'/assets/images/offline.png': ["public/assets/images/offline.png"],
		'/app/login/login.html': ["public/app/login/login.html"],
		'/app/main.js': ["public/app/main.js"],
		'/app/my-collections/collections.html': ["public/app/my-collections/collections.html"],
		'/app/pages/pages.html': ["public/app/pages/pages.html"],
		'/app/parser/parser.html': ["public/app/parser/parser.html"],
		'/app/popup-dialog/popup-dialog.html': ["public/app/popup-dialog/popup-dialog.html"],
		'/app/style.css': ["public/app/style.css"],
		'/app/subscriptions/subscriptions.html': ["public/app/subscriptions/subscriptions.html"],
		'/assets/fonts/Roboto.css': ["public/assets/fonts/Roboto.css"],
		'/assets/icons/add_circle.svg': ["public/assets/icons/add_circle.svg"],
		'/assets/icons/add.svg': ["public/assets/icons/add.svg"],
		'/assets/icons/category_add.svg': ["public/assets/icons/category_add.svg"],
		'/assets/icons/favorite.svg': ["public/assets/icons/favorite.svg"],
		'/assets/icons/ic_add_white_36px.svg': ["public/assets/icons/ic_add_white_36px.svg"],
		'/assets/icons/ic_chat_48px.svg': ["public/assets/icons/ic_chat_48px.svg"],
		'/assets/icons/ic_chat_bubble_black_24px.svg': ["public/assets/icons/ic_chat_bubble_black_24px.svg"],
		'/assets/icons/ic_delete_black_24px.svg': ["public/assets/icons/ic_delete_black_24px.svg"],
		'/assets/icons/ic_favorite_border_black_24px.svg': ["public/assets/icons/ic_favorite_border_black_24px.svg"],
		'/assets/icons/ic_favorite_white_48px.svg': ["public/assets/icons/ic_favorite_white_48px.svg"],
		'/assets/icons/ic_folder_black_24px.svg': ["public/assets/icons/ic_folder_black_24px.svg"],
		'/assets/icons/ic_menu_white_36px.svg': ["public/assets/icons/ic_menu_white_36px.svg"],
		'/assets/icons/ic_mode_edit_black_24px.svg': ["public/assets/icons/ic_mode_edit_black_24px.svg"],
		'/assets/icons/ic_playlist_add_white_36px.svg': ["public/assets/icons/ic_playlist_add_white_36px.svg"],
		'/assets/icons/ic_refresh_black_24px.svg': ["public/assets/icons/ic_refresh_black_24px.svg"],
		'/assets/icons/ic_share_black_24px.svg': ["public/assets/icons/ic_share_black_24px.svg"],
		'/assets/icons/ic_thumb_down_black_24px.svg': ["public/assets/icons/ic_thumb_down_black_24px.svg"],
		'/assets/icons/ic_thumb_up_black_24px.svg': ["public/assets/icons/ic_thumb_up_black_24px.svg"],
		'/assets/icons/menu.svg': ["public/assets/icons/menu.svg"],
		'/assets/icons/more_vert.svg': ["public/assets/icons/more_vert.svg"],
		'/assets/icons/icon-news.png': ["public/assets/icons/icon-news.png"],
// 		'/assets/icons/newspaper.png': ["public/assets/icons/newspaper.png"],
		'/assets/icons/sidebar_home.svg': ["public/assets/icons/sidebar_home.svg"],
		'/assets/images/news.jpg': ["public/assets/images/news.jpg"],
	}



	var runtimeCachingOptions = [{
			urlPattern: /\/subscriptions/,
			handler: 'fastest',
			options: {
				cache: {
					maxEntries: 10,
					name: 'subscriptions-cache'
				}
			}
		}, {
			urlPattern: /\/articles/,
			handler: 'fastest',
			options: {
				cache: {
					maxEntries: 10,
					name: 'article-view-cache'
				}
			}
		}, {
			urlPattern: /(.com|.net|1337)$/,
			handler: 'fastest',
			options: {
				cache: {
					maxEntries: 5,
					name: 'home-cache'
				}
			}
		}, {
			urlPattern: /\/home/,
			handler: 'fastest'
		}, {
			urlPattern: /\/app\/articles/,
			handler: 'fastest'
		}, {
			urlPattern: /\/collections/,
			handler: 'fastest'
		}, {
			urlPattern: /\/comments\/page\/([1-9].*|[a-z].*)/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/comments\/page\/([1-9].*|[a-z].*)/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/pages\/user/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/folders\/user\/me/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/pages\/user\/me/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/categories/,
			handler: 'fastest',
		}, {
			urlPattern: /\/api\/folders\/user/,
			handler: 'fastest'
		}, {
			urlPattern: /\/api\/subscriptions\/user/,
			handler: 'fastest'
		}
		// 	urlPattern: /\/api\/pages/,
		// 	handler: 'fastest'
		// }, {
		// 	urlPattern: /\/api\/pages\/recommended/,
		// 	handler: 'fastest',
		// },
		// }, {
		// }, {
		// {
		// 	urlPattern: /\/api\/*./
		// }
		// {
		// 	options: {
		// 		cache: {
		// 			maxEntries: 5,
		// 			name: 'categories-cache'
		// 		}
		// 	}
		// }, {
		// }, {
		// }, {
		// }, {
	];

	swPrecache.write(path.join(rootDir, 'service-worker.js'), {
		//rootDir + '/**/*.{js,html,css,png,jpg,gif,ico,svg}'
		importScripts: ['sw-routes.js'], // import script from public and insert into service-worker scope
		staticFileGlobs: [
			// rootDir + '/app/**/*.{js,html,css,png,jpg,gif,ico,svg}',
			// rootDir + '/assets/**/*.{html,css,png,jpg,gif,ico,svg}',
		],
		stripPrefix: rootDir,
		dynamicUrlToDependencies: dependencies,
		runtimeCaching: runtimeCachingOptions,
		verbose: true
	}, callback);
});



// Production tasks
// --------------------------------------------------------------

gulp.task('buildCSSProduction', function () {
	return gulp.src('./browser/scss/main.scss')
		.pipe(sass())
		.pipe(rename('style.css'))
		.pipe(minifyCSS())
		.pipe(gulp.dest('./public'))
});

gulp.task('buildJSProduction', function () {
	return gulp.src(['./browser/app/app.js', './browser/app/**/*.js'])
		.pipe(concat('main.js'))
		.pipe(babel())
		.pipe(ngAnnotate())
		.pipe(uglify())
		.pipe(gulp.dest('./public/app'));
});

gulp.task('buildProduction', ['buildCSSProduction', 'buildJSProduction', 'buildIDB', 'copyImages', 'copyFonts', 'copyHTML', 'generateServiceWorker']);



// Composed tasks
// --------------------------------------------------------------


// gulp.task('build', function () {
//     runSeq(['buildJS', 'buildCSS', 'copyImages', 'buildIDB', 'copyFonts', 'copyHTML', 'generateServiceWorker', 'copyExtensionAssets']);
    
//     if (process.env.NODE_ENV === 'production') {
//         runSeq(['buildJSProduction', 'buildCSSProduction', 'buildIDB', 'copyImages', 'copyFonts', 'copyHTML', 'generateServiceWorker', 'copyExtensionAssets']);
//     } else {
//         runSeq(['buildJS', 'buildCSS', 'copyImages', 'buildIDB', 'copyFonts', 'copyHTML', 'generateServiceWorker', 'copyExtensionAssets']);
//     }
    
// });


gulp.task('build', gulpsync.sync(['buildJS', 'buildCSS', 'copyImages', 'buildIDB', 'copyFonts', 'copyHTML', 'generateServiceWorker', 'copyExtensionAssets']));

gulp.task('default', function () {

	gulp.start('build');

	// Run when any JS file inside /browser changes.
	gulp.watch('browser/**/*.js', function () {
		runSeq('buildJS', 'buildIDB', 'reload', 'generateServiceWorker');
	});

	// Run when anything inside of browser/scss changes.
	gulp.watch('browser/scss/**', function () {
		runSeq('buildCSS', 'reloadCSS', 'generateServiceWorker');
	});

	gulp.watch('server/**/*.js', ['lintJS']);

	//Add icons and images to public dist folder
	gulp.watch(['browser/**/*.svg', 'browser/**/*.png', 'browser/**/*.jpg'], function () {
		runSeq('copyImages', 'generateServiceWorker')
	})

	gulp.watch('/browser/assets/fonts/*.css', function () {
		runSeq('copyFonts', 'generateServiceWorker');
	})

	//Copy files to public when html changes
	gulp.watch('browser/**/*.html', function () {
		runSeq('copyHTML', 'generateServiceWorker')
	});

	// Reload when a template (.html) file changes.
	gulp.watch(['browser/**/*.html', 'server/app/views/*.html'], function () {
		runSeq('reload', 'generateServiceWorker')
	});

	// Run server tests when a server file or server test file changes.
	gulp.watch(['tests/server/**/*.js'], ['testServerJS']);

	// Run browser testing when a browser test file changes.
	gulp.watch('tests/browser/**/*', ['testBrowserJS']);

	livereload.listen();

});
