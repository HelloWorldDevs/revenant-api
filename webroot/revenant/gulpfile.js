var gulp = require('gulp');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');


var scriptSrc = './src/page/*.js',
    destDir = './dist/'

gulp.task('scripts', function() {
  return gulp.src(['./lib/spin/spin.min.js', './src/page/pageController.js', './src/page/page.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('revenant.js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(sourcemaps.write('map'))
    .pipe(gulp.dest(destDir));
});

gulp.task('watch', function() {
  // Watch .js files
  gulp.watch(scriptSrc, ['scripts']);
});

gulp.task('default', ['scripts','watch']);
