'use strict';

var gulp = require('gulp');


var SRC = 'src';
var OUT = 'out';
var BROWSERIFY_ENTRY_POINT = 'src';

function pack(options) {
	var webpack = require('webpack');

	return new Promise(function (resolve, reject) {
		webpack({
			entry: './src',
			output: {
				path: OUT,
				filename: 'contexta.js',
			},
			devtool: '#inline-source-map'
		}, function (err, stats) {
			if (err) {
				return reject(err);
			}

			var errors = stats.compilation.errors;
			if (errors.length > 0) {
				return reject(errors[0]);
			}

			return resolve();
		});
	});
}


gulp.task('default', ['build']);

gulp.task('build', function () {
	return pack({
		debug: false
	});
});

gulp.task('pack', ['build'], function (cb) {
	var exec = require('child_process').exec;
	var path = require('path');
	var gutil = require('gulp-util');

	var compilerDir = path.dirname(require.resolve('google-closure-compiler'));
	var compilerJar = path.join(compilerDir, 'compiler.jar');

	var options = (function (options) {
		var keys = Object.keys(options);
		return keys.reduce(function (s, key) {
			var value = options[key];

			if (value === true) {
				return s + ' --' + key;
			} else if (value) {
				if (Array.isArray(value)) {
					return s + value.reduce(function (s, x) {
						return s + ' --' + key + ' ' + x;
					}, '');
				} else {
					return s + ' --' + key + ' ' + value;
				}

			} else {
				return s;
			}
		}, '');
	}(function () {
		var options = require('./gcc-options');

		options.js = OUT + '/contexta.js';
		options.js_output_file = OUT + '/contexta.min.js';

		return options;
	}()));

	var cmd = 'java -server -XX:+TieredCompilation -jar ' + compilerJar + options;

	gutil.log(cmd);

	exec(cmd, function (err, stdout, stderr) {
		if (stdout) {
			gutil.log(stdout);
		}

		if (stderr) {
			return cb(new gutil.PluginError('google-closure-compiler', stderr));
		}

		cb();
	});
});
