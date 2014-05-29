/**
 * Windows build library
 */
var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	hyperloop = require('./dev').require('hyperloop-common'),
	util = hyperloop.util,
	log = hyperloop.log,
	programs = require('./programs');

exports.generateWindowsDesktopLibrary = generateWindowsDesktopLibrary;
exports.generateWindowsDesktopApp = generateWindowsDesktopApp;

var BINARY_FILE_EXTENSIONS = ['exe','lib','dll','pfx','png','gif','jpg'],
	binaryFilesRE = new RegExp('\.('+BINARY_FILE_EXTENSIONS.join('|')+')$'),
	srcFilesRE = new RegExp('\.(cpp|c)$'),
	headerFilesRE = new RegExp('\.(hpp|h)$'),
	ignoreFilesRE = /(\.(git|svn|cvs))|(Thumbs\.db)/;

function generateWindowsDesktopLibrary(options, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12_library'),
		builddir = path.join(options.dest, 'vsstudio');

	if (!fs.existsSync(builddir)) {
		wrench.mkdirSyncRecursive(builddir);
	}

	var clcompiles = '',
		clincludes = '',
		copybase = path.join(builddir, 'hyperloop');
	util.filelisting(options.srcdir,function(f) { return !ignoreFilesRE.test(f); }).forEach(function(from) {
		var basename = path.basename(from),
			to = path.join(copybase, basename),
			todir = path.dirname(to);
		log.debug(to);
		if (srcFilesRE.test(from)) {
			clcompiles += '    <ClCompile Include="'+basename+'" />\r\n';
		} else if (headerFilesRE.test(from)) {
			clincludes += '    <ClInclude Include="'+basename+'" />\r\n';
		}
		log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(builddir,to));
		if (!fs.existsSync(todir)) {
			wrench.mkdirSyncRecursive(todir);
		}
		fs.writeFileSync(to, fs.readFileSync(from));
	});

	// copy all header files in options.dest
	fs.readdirSync(options.dest).forEach(function(f) {
		if (headerFilesRE.test(f)) {
			var from = path.join(options.dest, f),
				to = path.join(copybase, path.basename(f));
			log.debug('Copying',f,'to',copybase);
			fs.writeFileSync(to, fs.readFileSync(from));
		}
	});

	// copy JavaScriptCore headers
	var jsCoreDirFrom = path.join(__dirname, '..', 'templates', 'JavaScriptCore'),
		jsCoreDirTo = path.join(copybase, 'JavaScriptCore');
	if (!fs.existsSync(jsCoreDirTo)) {
		wrench.mkdirSyncRecursive(jsCoreDirTo);
	}
	fs.readdirSync(jsCoreDirFrom).forEach(function(f) {
		if (headerFilesRE.test(f)) {
			var from = path.join(jsCoreDirFrom, f),
				to = path.join(copybase, 'JavaScriptCore', path.basename(f));
			log.debug('Copying',f,'to',copybase);
			fs.writeFileSync(to, fs.readFileSync(from));
		}
	});

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$HYPERLOOP_CLCOMPILES\\$': clcompiles,
		'\\$HYPERLOOP_CLINCLUDES\\$': clincludes
	};

	copyAndFilterString(options, templatedir, builddir, filterValues);

	var solutionFile = path.join(builddir, 'hyperloop.sln');
	programs.msbuild(solutionFile+' /p:Platform=Win32', callback, options);
}

function generateWindowsDesktopApp(options, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12_desktop'),
		builddir = path.join(options.dest, 'vsstudio');

	if (!fs.existsSync(builddir)) {
		wrench.mkdirSyncRecursive(builddir);
	}

	options['identity-name'] = options['identity-name'] || 'hyperlooptest.' + options.name;

	// copy generated source and header files
	var generated_dir = path.join(options.srcdir, 'generated'),
		clcompiles = '',
		clincludes = '';
	util.filelisting(generated_dir,function(f) { return !ignoreFilesRE.test(f); }).forEach(function(from) {
		var basename = path.basename(from),
			to = path.join(builddir, options.name, basename),
			todir = path.dirname(to);
		if (srcFilesRE.test(from)) {
			clcompiles += '    <ClCompile Include="'+basename+'" />\r\n';
		} else if (headerFilesRE.test(from)) {
			clincludes += '    <ClInclude Include="'+basename+'" />\r\n';
		}
		log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(builddir,to));
		if (!fs.existsSync(todir)) {
			wrench.mkdirSyncRecursive(todir);
		}
		fs.writeFileSync(to, fs.readFileSync(from));
	});

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$APPLAUNCHTOKEN\\$': options.launchToken,
		'\\$IDENTITY_NAME\\$': options['identity-name'],
		'\\$CERTNAME\\$': options.certname,
		'\\$HYPERLOOP_CLCOMPILES\\$': clcompiles,
		'\\$HYPERLOOP_CLINCLUDES\\$': clincludes
	};

	fs.writeFileSync(path.join(options.dest, 'launchinfo.json'), 
				JSON.stringify({token:options.launchToken, identity:options['identity-name']}));

	copyAndFilterString(options, templatedir, builddir, filterValues);

	callback();
}

function copyAndFilterString(options, templatedir, builddir, filterValues) {
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
}