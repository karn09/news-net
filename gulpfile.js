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

// Development tasks
// --------------------------------------------------------------

// Live reload business.
gulp.task('reload', function () {
    livereload.reload();
});

gulp.task('reloadCSS', function () {
    return gulp.src('./public/style.css').pipe(livereload());
});

gulp.task('lintJS', function () {

    return gulp.src(['./browser/js/**/*.js', './server/**/*.js'])
        .pipe(plumber({
            errorHandler: notify.onError('Linting FAILED! Check your gulp process.')
        }))
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());

});

gulp.task('buildJS', ['lintJS'], function () {
    return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./public'));
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
        .pipe(gulp.dest('./public'));
});

gulp.task('copyHTML', function(){
    return gulp.src(['./browser/html/**/*.html'], {base: './browser/'})
    .pipe(gulp.dest('./public'))
})


// Testing
// --------------------------------------------------------------

gulp.task('testServerJS', function () {
    require('babel-register');
	return gulp.src('./tests/server/**/*.js', {
		read: false
	}).pipe(mocha({ reporter: 'spec' }));
});

gulp.task('testServerJSWithCoverage', function (done) {
    gulp.src('./server/**/*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            gulp.src('./tests/server/**/*.js', {read: false})
                .pipe(mocha({reporter: 'spec'}))
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

gulp.task('generateServiceWorker', function(callback) {
  var path = require('path');
  var swPrecache = require('sw-precache');

  var rootDir = 'public';

  //Libraries our project depends on.
    var dependencies = {
        '/lodash/index.js': ['node_modules/lodash/index.js'],
        '/angular/angular.js': ['node_modules/angular/angular.js'],
        '/angular-animate/angular-animate.js': ['node_modules//angular-animate/angular-animate.js'],
        '/angular-ui-router/release/angular-ui-router.js': ['node_modules/angular-ui-router/release/angular-ui-router.js'],
        '/angular-ui-bootstrap/ui-bootstrap.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap.js'],
        '/angular-ui-bootstrap/ui-bootstrap-tpls.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js'],
        '/socket.io-client/socket.io.js': ['node_modules/socket.io-client/socket.io.js'],
        '/bootstrap/dist/css/bootstrap.css': ['node_modules/bootstrap/dist/css/bootstrap.css'],
        '/angular-material/angular-material.js': ['node_modules/angular-material/angular-material.js'],
        '/angular-aria/angular-aria.js': ['node_modules/angular-aria/angular-aria.js'],
        '/angular-material/angular-material.css': ['node_modules/angular-material/angular-material.css'],
    }

    var runtimeCachingOptions = [{
      urlPattern: /^http:\/\/localhost:1337\/api\/pages/,
      handler: 'fastest'
    }]

  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif}'],
    stripPrefix: rootDir,
    dynamicUrlToDependencies: dependencies,
    runtimeCaching: runtimeCachingOptions
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
    return gulp.src(['./browser/js/app.js', './browser/js/**/*.js'])
        .pipe(concat('main.js'))
        .pipe(babel())
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

gulp.task('buildProduction', ['buildCSSProduction', 'buildJSProduction']);



// Composed tasks
// --------------------------------------------------------------

gulp.task('build', function () {
    if (process.env.NODE_ENV === 'production') {
        runSeq(['buildJSProduction', 'buildCSSProduction', 'copyHTML', 'generateServiceWorker']);
    } else {
        runSeq(['buildJS', 'buildCSS', 'copyHTML', 'generateServiceWorker']);
    }
});


gulp.task('default', function () {

    gulp.start('build');

    // Run when anything inside of browser/js changes.
    gulp.watch('browser/js/**', function () {
        runSeq('buildJS', 'reload');
    });

    // Run when anything inside of browser/scss changes.
    gulp.watch('browser/scss/**', function () {
        runSeq('buildCSS', 'reloadCSS');
    });

    gulp.watch('server/**/*.js', ['lintJS']);

    //Copy files to public when html changed
    gulp.watch('browser/**/*.html', ['copyHTML']);

    // Reload when a template (.html) file changes.
    gulp.watch(['browser/**/*.html', 'server/app/views/*.html'], ['reload']);

    // Run server tests when a server file or server test file changes.
    gulp.watch(['tests/server/**/*.js'], ['testServerJS']);

    // Run browser testing when a browser test file changes.
    gulp.watch('tests/browser/**/*', ['testBrowserJS']);

    livereload.listen();

});
