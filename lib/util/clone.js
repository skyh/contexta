'use strict';

module.exports = function (x) {
	return Object.keys(x).reduce(function (x, s, key) {
		s[key] = x[key];
		return s;
	}.bind(null, x), {});
};
