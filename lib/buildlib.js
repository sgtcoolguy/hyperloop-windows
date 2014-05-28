/**
 * Windows build library
 */
var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	hyperloop = require('./dev').require('hyperloop-common'),
	util = hyperloop.util,
	log = hyperloop.log;

exports.getSystemFrameworks = getSystemFrameworks;
exports.buildWindowsDesktopApp = buildWindowsDesktopApp;

//TODO: remove this -- not sure if needed
function getSystemFrameworks(callback) {
	return callback(null, [], 'C:\\Program Files (x86)\\Microsoft Visual Studio 12.0\\VC\\include');
}

var BINARY_FILE_EXTENSIONS = ['exe','lib','dll','pfx','png','gif','jpg'];

function buildWindowsDesktopApp(options, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12_desktop'),
		builddir = path.join(options.dest, 'vsstudio'),
		binaryFilesRE = new RegExp('\.('+BINARY_FILE_EXTENSIONS.join('|')+')$'),
		ignoreFilesRE = /(\.(git|svn|cvs))|(Thumbs\.db)/;

	if (!fs.existsSync(builddir)) {
		wrench.mkdirSyncRecursive(builddir);
	}

	options['identity-name'] = options['identity-name'] || 'hyperlooptest.' + options.name;

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$APPLAUNCHTOKEN\\$': options.launchToken,
		'\\$IDENTITY_NAME\\$': options['identity-name'],
		'\\$CERTNAME\\$': options.certname
	};

	fs.writeFileSync(path.join(options.dest, 'launchinfo.json'), 
				JSON.stringify({token:options.launchToken, identity:options['identity-name']}));

	util.filelisting(templatedir,function(f) { return !binaryFilesRE.test(f) && !ignoreFilesRE.test(f) }).forEach(function(from) {
		var dir = path.relative(templatedir,path.dirname(from)),
			fn = path.join(dir, path.basename(from)),
			to = path.join(builddir, fn).replace(/APPNAME/g,options.name),
			todir = path.dirname(to);
		log.debug('Copying and filtering',path.relative(templatedir,from),'to',path.relative(builddir,to));
		if (!fs.existsSync(todir)) {
			wrench.mkdirSyncRecursive(todir);
		}
		util.copyAndFilterString(from, to, filterValues);
	});
	util.filelisting(templatedir,function(f) { return binaryFilesRE.test(f) && !ignoreFilesRE.test(f) }).forEach(function(from) {
		var dir = path.relative(templatedir,path.dirname(from)),
			fn = path.join(dir, path.basename(from)),
			to = path.join(builddir, fn).replace(/APPNAME/g,options.name),
			todir = path.dirname(to);
		log.debug('Copying',path.relative(templatedir,from),'to',path.relative(builddir,to));
		if (!fs.existsSync(todir)) {
			wrench.mkdirSyncRecursive(todir);
		}
		fs.writeFileSync(to, fs.readFileSync(from));
	});
	callback();
}