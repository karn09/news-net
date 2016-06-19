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

gulp.task('copyImages', function(){
    return gulp.src([
        './browser/assets/icons/**/*.svg',
        './browser/assets/images/**/*.jpg',
        './browser/assets/images/**/*.png'
        ],
        {base: './browser/'})
    .pipe(gulp.dest('./public'))
});

gulp.task('copyFonts', function(){
    return gulp.src(['./browser/assets/fonts/**/*.css'], {base: './browser/'})
    .pipe(gulp.dest('./public'))
});

gulp.task('copyHTML', function(){
    return gulp.src(['./browser/app/**/*.html'], {base: './browser/'})
    .pipe(gulp.dest('./public'))
})

gulp.task('clean', function(){
    return gulp.src(['./public/html', './public/js', './public/main.js', './public/style.css', './public/icons'], {read: false})
    .pipe(clean());
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
        '/jquery/dist/jquery.js': ['node_modules/lodash/index.js'],
        '/angular/angular.js': ['node_modules/angular/angular.js'],
        '/angular-animate/angular-animate.js': ['node_modules/angular-animate/angular-animate.js'],
        '/angular-messages/angular-messages.js': ['node_modules/angular-messages/angular-messages.js'],
        '/angular-ui-router/release/angular-ui-router.js': ['node_modules/angular-ui-router/release/angular-ui-router.js'],
        '/angular-ui-bootstrap/ui-bootstrap.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap.js'],
        '/angular-ui-bootstrap/ui-bootstrap-tpls.js': ['node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js'],
        '/socket.io-client/socket.io.js': ['node_modules/socket.io-client/socket.io.js'],
        '/bootstrap/dist/css/bootstrap.css': ['node_modules/bootstrap/dist/css/bootstrap.css'],
        '/angular-material/angular-material.js': ['node_modules/angular-material/angular-material.js'],
        '/angular-aria/angular-aria.js': ['node_modules/angular-aria/angular-aria.js'],
        '/angular-material/angular-material.css': ['node_modules/angular-material/angular-material.css']
    }

    var runtimeCachingOptions = [

    { urlPattern: /\/api\/categories/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 5,
          name: 'categories-cache'
        }
      }
    },
    { urlPattern: /\/subscriptions/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 5,
          name: 'subscriptions-cache'
        }
      }
    },
    { urlPattern: /\/articles/,
      handler: 'fastest',
      options: {
        cache: {
          maxEntries: 5,
          name: 'article-view-cache'
        }
      }
    },
  ];

  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    //rootDir + '/**/*.{js,html,css,png,jpg,gif,ico,svg}'
    importScripts: ['sw-routes.js'], // import script from public and insert into service-worker scope
    staticFileGlobs: [rootDir + '/app/**/*.{js,html,css,png,jpg,gif,ico,svg}', rootDir + '/assets/**/*.{html,css,png,jpg,gif,ico,svg}'],
    stripPrefix: rootDir,
    dynamicUrlToDependencies: dependencies,
    runtimeCaching: runtimeCachingOptions,
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

gulp.task('build', function () {
    if (process.env.NODE_ENV === 'production') {
        runSeq(['buildJSProduction', 'buildCSSProduction', 'buildIDB', 'copyImages', 'copyFonts', 'copyHTML', 'generateServiceWorker']);
    } else {
        runSeq(['buildJS', 'buildCSS', 'copyImages', 'buildIDB', 'copyFonts', 'copyHTML', 'generateServiceWorker']);
    }
});


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
    gulp.watch(['browser/**/*.svg', 'browser/**/*.png', 'browser/**/*.jpg'], function(){
        runSeq('copyImages', 'generateServiceWorker')
    })

    gulp.watch('/browser/assets/fonts/*.css', function(){
        runSeq('copyFonts', 'generateServiceWorker');
    })

    //Copy files to public when html changes
    gulp.watch('browser/**/*.html', function(){
        runSeq('copyHTML', 'generateServiceWorker')
    });

    // Reload when a template (.html) file changes.
    gulp.watch(['browser/**/*.html', 'server/app/views/*.html'], function(){
        runSeq('reload', 'generateServiceWorker')
    });

    // Run server tests when a server file or server test file changes.
    gulp.watch(['tests/server/**/*.js'], ['testServerJS']);

    // Run browser testing when a browser test file changes.
    gulp.watch('tests/browser/**/*', ['testBrowserJS']);

    livereload.listen();

});
