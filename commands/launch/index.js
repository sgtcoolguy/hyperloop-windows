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
	path = require('path'),
	fs = require('fs'),
	wrench = require('wrench'),
	programs = require('../../lib/programs'),
	appc = require('node-appc');

module.exports = new Command(
	'launch',
	'Launch the application in the Windows VM',
	[
	],
	function(state,done) {
		var options = state.options;
		if (options.target == 'Windows') {
			return launchForWindows(state, done);
		} else if (options.target == 'WindowsPhone' && options.arch == 'arm') {
			return launchForWindowsPhone(state, done);
		} else if (options.target == 'WindowsPhone' && options.arch == 'x86') {
			return launchForWindowsPhoneEmu(state, done);
		} else {
			log.fatal('launch not implemented for '+options.arch);
		}
	}
);

function getAppGUID(options) {
	var file = path.join(options.dest,'vsstudio',options.name,'guid');
	options.guidPath = file;
	if (fs.existsSync(file)) {
		return fs.readFileSync(file, 'utf8');
	}
	return undefined;
}

function launchForWindowsPhone(state,done) {
	try {
		var options = state.options,
			name = options.name;
		options.appDir = path.join(options.dest,'vsstudio',name);

		var appPackages = path.join(options.appDir, options.name, options.name+'.'+options.target, 'AppPackages'),
			appguid = getAppGUID(options);

		if (!fs.exists(appPackages)) {
			wrench.mkdirSyncRecursive(appPackages);
		}

		findAppX();

		function findAppX() {
			var files = wrench.readdirSyncRecursive(appPackages).filter(function(f) {
				return f.match(/Debug\.appx$|Debug\.appxbundle$/);
			});
			if (!files || !files.length) {
				log.fatal('Could not find a generated Debug.AppX for your app.');
			}
			else {
				installAppX(path.join(appPackages, files[0]));
			}
		}

		function installAppX(at) {
			var fullat = path.resolve(at);
			programs.appdeploycmd(['/uninstall '+appguid+' /targetdevice:de'], function(err) {
				programs.appdeploycmd(['/install \"'+fullat+'\" /targetdevice:de'], function(err) {
					if (err) {
						log.error('Failed to install app.');
						log.fatal(err);
					}
					programs.appdeploycmd(['/launch '+appguid+' /targetdevice:de'], function(err) {
						if (err) {
							log.error('Failed to launch app.');
							log.fatal(err);
						}

					});
				});
			});
		}
	} catch (E) {
		done(E);
	}
}

function launchForWindowsPhoneEmu(state,done) {
	try {
		var options = state.options,
			name = options.name;
		options.appDir = path.join(options.dest,'vsstudio',name);

		var appPackages = path.join(options.appDir, options.name, options.name+'.'+options.target, 'AppPackages'),
			appguid = getAppGUID(options);

		findAppX();

		function findAppX() {
			var files = wrench.readdirSyncRecursive(appPackages).filter(function(f) {
				return f.match(/Debug\.appx$/);
			});
			if (!files || !files.length) {
				log.fatal('Could not find a generated Debug.AppX for your app.');
			}
			else {
				installAppX(path.join(appPackages, files[0]));
			}
		}

		function installAppX(at) {
			var fullat = path.resolve(at);
			programs.appdeploycmd(['/uninstall '+appguid+' /targetdevice:xd'], function(err) {
				programs.appdeploycmd(['/install \"'+fullat+'\" /targetdevice:xd'], function(err) {
					if (err) {
						log.error('Failed to install app.');
						log.fatal(err);
					}
					programs.appdeploycmd(['/launch '+appguid+' /targetdevice:xd'], function(err) {
						if (err) {
							log.error('Failed to launch app.');
							log.fatal(err);
						}

					});
				});
			});
		}
	} catch (E) {
		done(E);
	}
}

function launchForWindows(state,done) {
	try {
		var options = state.options,
			name = options.name;

		options.appDir = path.join(options.dest,'vsstudio',name);

		(function uninstallApp() {
			var guid = getAppGUID(options);
			if (guid) {
				var identityName = options['identity-name'] || 'hyperlooptest.' + options.name,
					cmd = '"get-appxpackage \'' + identityName + '*\' | remove-appxpackage"';

				programs.powershell(cmd, function(err) {
					return findPackagePs1();
				});
			} else {
				return findPackagePs1();
			}
		})();

		function findPackagePs1() {
			var canForce = false;
			var appPackages = path.join(options.appDir, options.name, options.name+'.'+options.target, 'AppPackages');
			var files = wrench.readdirSyncRecursive(appPackages).filter(function(f) {
				return f.match(/Add\-AppDevPackage\.ps1$/);
			});

			// did we find it?
			if (!files || !files.length) {
				log.debug('Could not find Add-AppDevPackage., trying AppX...');
				return findAppX();
			}
			var ps1File = path.join(appPackages, files[0]);

			programs.powershell(
				// make sure there's a valid dev license
				'"(Get-WindowsDeveloperLicense | Where-Object { $_.IsValid }).Count -gt 0 -and ' +
				// make sure there's a signed dev cert
				'(Get-AuthenticodeSignature (gci (Join-Path \'' + path.dirname(ps1File) + '\' \'*.appx\'))[0]).Status -eq \'Valid\'',
				function(err) {
					if (err) {
						canForce = false;
					}

					var cmd = '-ExecutionPolicy Unrestricted "& \'' + ps1File + '\'' + (canForce ? ' -Force' : '') + '"';
					programs.powershell(cmd, function(err) {
						if (err) {
							log.error('Failed to install the app.');
							log.fatal(err);
						}
						log.debug('App installed.');
						runAppX();
					});
				},
				{
					stdOut: function(data) {
						if (/True/.test(data)) {
							canForce = true;
						}
					},
					stdErr: function(data){}
				}
			);
		}

		function findAppX() {
			var appPackages = path.join(options.appDir, options.name, options.name+'.'+options.target, 'AppPackages'),
			    files = wrench.readdirSyncRecursive(appPackages).filter(function(f) {
				return f.match(/Debug\.appx$/);
			});
			if (!files || !files.length) {
				log.fatal('Could not find a generated Debug.AppX for your app.');
			}
			else {
				addAppX(path.join(appPackages, files[0]));
			}
		}

		function addAppX(at) {
			log.debug('Installing the app...');
			programs.powershell('"& Add-AppxPackage \'' + at + '\'"', function ran(err) {
				if (err) {
					var strErr = String(err).replace(/[\r\n]/g, ''),
						alreadyInstalled = strErr.match('Remove package ([^ ]+) before installing')
							|| strErr.match('Deployment of package ([^ ]+) was blocked because the provided package has the same identity')
							|| strErr.match('The conflicting package is ([^ ]+) and it was published by'),
						notTrusted = strErr.match('The root certificate of the signature in the app package or bundle must be trusted'),
						needsSideloading = strErr.match('or a sideloading-enabled system');
					if (notTrusted) {
						openPVK();
					}
					else if (needsSideloading) {
						askForSideloading();
					}
					else if (alreadyInstalled) {
						removeAppX(at, alreadyInstalled[1].trim());
					}
					else {
						log.error('Failed to install the app.');
						log.fatal(err);
					}
				}
				else {
					log.debug('App installed.');
					runAppX();
				}
			});
		}

		function openPVK() {
			var pfx = path.join(options.appDir, options.pfx);
			log.error('You need to import the .pfx to LOCAL MACHINE in to the TRUSTED ROOT CERTIFICATION AUTHORITIES store.\n');
			log.error('\t1. For "Store Location" choose "Local Machine" and click "Next".');
			log.error('\t2. Approve any User Access Control prompts you receive.');
			log.error('\t3. For "File to Import" and "Private key protection", no changes are necessary. Click "Next" twice.');
			log.error('\t4. For "Certificate Store", choose "Place all certificates in the following store".');
			log.error('\t5. Click "Browse...".');
			log.error('\t6. Select "Trusted Root Certification Authorities" and click "OK".');
			log.error('\t7. Click "Next" then "Finish".\n');
			log.error('Opening the wizard for ' + pfx.bold);
			programs.explorer('"' + pfx + '"', function ran() {
				log.fatal('Please re-run hyperloop after successfully following the above instructions.');
			});
		}

		function askForSideloading() {
			var pfx = path.join(options.appDir, options.pfx);
			log.error('You need to enable application sideloading on this machine.\n');
			log.error('In a moment, your Local Group Policy Editor should open..\n');
			log.error('\t1. Click to expand ' + 'Computer Configuration'.bold + ', ' + 'Administrative Templates'.bold + ', ' + 'Windows Components'.bold + ', and then ' + 'App Package Deployment'.bold + '.');
			log.error('\t2. Double-click the ' + 'Allow development of Windows Store apps without installing a developer license'.bold + ' setting.');
			log.error('\t3. In the Allow development of Windows Store apps without installing a developer license window, click ' + 'Enabled'.bold + ' and then click ' + 'OK'.bold + '.');
			log.error('\t4. Double-click the ' + 'Allow all trusted apps to install'.bold + ' setting.');
			log.error('\t5. In the Allow all trusted apps to install window, click ' + 'Enabled'.bold + ' and then click ' + 'OK'.bold + '.');
			log.error('Running ' + 'gpedit.msc'.bold);
			programs.gpedit('', function ran() {
				log.fatal('Please re-run hyperloop after successfully following the above instructions.');
			});
		}

		function removeAppX(at, oldID) {
			log.debug('Uninstalling an old version of the app...');
			programs.powershell('Remove-AppxPackage ' + oldID, function ran(err) {
				if (err) {
					log.error('Failed to uninstall your app.');
					log.error(err);
					log.fatal('Please manually uninstall the app before trying again.');
				}
				else {
					addAppX(at);
				}
			});
		}

		function runAppX() {
			var appinfo = JSON.parse(fs.readFileSync(path.join(options.dest,'appinfo.json')).toString());
			options.launchToken = appinfo.token;
			options['identity-name'] = appinfo.identity;
			programs.explorer(options.launchToken+':', function ran(err) {
				// TODO: Sometimes, it doesn't launch. Or it doesn't focus. Not sure which.
				log.info(name.green + ' successfully installed and launched: ' + options.launchToken.green + '\n\n');
				tailLog();
			});
		}

		function tailLog() {
			programs.tasklist('/APPS /FO CSV /NH', function(err, stdout, stderr) {
				var identityName = options['identity-name'],
					lines = stdout.split('\n')
					.map(function(line) {
						var csv = line.split(","),
							name = csv.pop().slice(1, -2),
							splitAroundID = name.split('__');
						return { id: splitAroundID[1], name: splitAroundID[0] };
					})
					.filter(function(app) {
						return app.id && app.name && app.name.indexOf(identityName) === 0;
					});
				if (lines.length === 0) {
					// TODO: Instead of a fatal error, maybe try running it again?
					log.fatal('Unable to find the app in the current task list.');
				}
				if (lines.length > 1) {
					log.info('More than one running process matches your app. Tailing log from the latest.');
					log.info(lines);
				}
				var appLog = path.resolve(process.env['AppData'] + '/../Local/Packages/' + identityName + '_' + lines.pop().id + '/LocalState/log.txt');
				// TODO: Make sure file exists.
				// TODO: If it doesn't... touch it?

				log.info('Tailing log:\r\n\t' + appLog.green);
				log.info('Waiting for log messages. Press ' + 'Ctrl + C'.bold.yellow + ' to stop.');
				log.info('');
				tailLog();

				function tailLog() {
					if (!fs.existsSync(appLog)) {
						setTimeout(tailLog, 1000);
					}
					else {
						programs.powershell('Get-Content -Path "' + appLog + '" -Wait', done, {
							stdOut: function(data) {
								console.log(data.replace(/\r\n$/, ''));
							}
						});
					}
				}
			});
		}
	} catch (E) {
		done(E);
	}
}

