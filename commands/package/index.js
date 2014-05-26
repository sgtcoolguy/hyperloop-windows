/*
 * Packager
 */
var	hyperloop = require('../../lib/dev').require('hyperloop-common'),
	Command = hyperloop.Command;

module.exports = new Command(
	'package',
	'Package the application for Windows',
	[
	],
	function(state,done) {
		done('not yet implemented');
	}
);