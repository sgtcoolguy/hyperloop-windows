/*
 * Launcher
 */
var path = require('path'),
	hyperloop = require('../../lib/dev').require('hyperloop-common'),
	log = hyperloop.log,
	Command = hyperloop.Command,
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	util = hyperloop.log,
	buildlib = require('../../lib/buildlib');

module.exports = new Command(
	'launch',
	'Launch the application in the Windows VM',
	[
	],
	function(state,done) {
		try {
			
			done('not yet implemented');

		} catch (E) {
			done(E);
		}
	}
);

