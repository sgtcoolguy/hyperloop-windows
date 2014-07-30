/*
 * Clean platform specific resources
 */
var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	hyperloop = require('../../lib/dev').require('hyperloop-common'),
	log = hyperloop.log,
	Command = hyperloop.Command;

module.exports = new Command(
	'clean',
	'Clean platform specific resources',
	[
		{name:'dest',required:true,description:'specify the directory where files that have been generated will be cleaned'},
		{name:'uninstall', required:false, description:'uninstall the application', platform:/^win/ },
		{name:'platform',required:true,description:'specify the platform to target such as ios'}
	],
	function(state, done) {
		var options = state.options;
		try {

			if (fs.existsSync(options.dest)) {
				try {
					wrench.rmdirSyncRecursive(options.dest);
					log.info('Cleaned',options.dest.yellow);
				} catch (e) {
					if (/EBUSY/.test(e.message) && /^win/.test(process.platform)) {
						log.error(e.message);
						log.error('Try "File -> Close Solution" in Visual Studio, then run clean again.');
					}
				}
			}
			if (options.uninstall) {
				// only run on windows desktop
				if (options.target != 'Windows') {
					return done("`hyperloop clean --uninstall` only supported on Windows Desktop");
				}
				var programs = require('../../lib/programs');

				// remove all apps with hyperloop prefix
				programs.powershell('"get-appxpackage \'hyperlooptest.*\' | remove-appxpackage"', function(err) {
					if (err) {
						log.error('There was an error uninstalling apps');
						log.error(err);
						done(err);
					} else {
						done();
					}
				});
			} else {
				done();
			}
		} catch (E) {
			done(E);
		}
	}
);