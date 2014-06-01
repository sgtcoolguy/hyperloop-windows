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

exports.getLibraryOutputPath = getLibraryOutputPath;
exports.generateLibrary = generateLibrary;
exports.generateApp = generateApp;

var BINARY_FILE_EXTENSIONS = ['exe','lib','dll','pfx','png','gif','jpg'],
	binaryFilesRE = new RegExp('\.('+BINARY_FILE_EXTENSIONS.join('|')+')$'),
	srcFilesRE = new RegExp('\.(cpp|c)$'),
	headerFilesRE = new RegExp('\.(hpp|h)$'),
	ignoreFilesRE = /(\.(git|svn|cvs))|(Thumbs\.db)/;

function generateLibrary(options, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12', 'hyperloop'),
		builddir = path.join(getMSBuildBase(options),'hyperloop'),
		copybase = path.join(builddir, 'hyperloop');

	if (!fs.existsSync(copybase)) {
		wrench.mkdirSyncRecursive(copybase);
	}

	// collect hyperloop library source/header files
	var clcompiles = '',
		clincludes = '';
	util.filelisting(options.srcdir,function(f) { return !ignoreFilesRE.test(f); }).forEach(function(from) {
		var basename = path.basename(from),
			to = path.join(copybase, basename),
			todir = path.dirname(to);
		if (srcFilesRE.test(from)) {
			clcompiles += '    <ClCompile Include="'+basename+'" />\r\n';
		} else if (headerFilesRE.test(from)) {
			clincludes += '    <ClInclude Include="'+basename+'" />\r\n';
		}
		log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(copybase,to));
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

	var solutionFile = path.join(builddir, 'hyperloop.sln'),
		configuration = getMSBuildConfiguration(options),
		vsargs = ' /p:Platform=Win32 /p:Configuration='+configuration;

	programs.msbuild(solutionFile+vsargs, callback, options);
}

function getMSBuildBase(options) {
	return path.join(options.dest, 'vsstudio');
}

function getLibraryOutputPath(options) {
	return path.join(getMSBuildBase(options),getMSBuildConfiguration(options),'hyperloop','hyperloop','hyperloop.lib');
}

function getMSBuildConfiguration(options) {
	if (options.environment == 'production') {
		return 'Release';
	}
	return 'Debug';
}

function generateApp(options, arch_results, settings, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12', 'app'),
		builddir = path.join(getMSBuildBase(options),options.name),
		copybase = path.join(builddir, options.name);

	if (!fs.existsSync(copybase)) {
		wrench.mkdirSyncRecursive(copybase);
	}

	// collect hyperloop library source/header files
	var clcompiles = '',
		clincludes = '';
	arch_results[options.arch].forEach(function(f) {
		var from = f.srcfile,
			basename = path.basename(from),
			to = path.join(copybase, basename),
			todir = path.dirname(to);
		if (srcFilesRE.test(from)) {
			clcompiles += '    <ClCompile Include="'+basename+'" />\r\n';
		} else if (headerFilesRE.test(from)) {
			clincludes += '    <ClInclude Include="'+basename+'" />\r\n';
		}
		log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(copybase,to));
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
		'\\$APP_CLCOMPILES\\$': clcompiles,
		'\\$APP_CLINCLUDES\\$': clincludes
	};

	copyAndFilterString(options, templatedir, builddir, filterValues);

	var solutionFile = path.join(builddir, options.name+'.sln'),
		configuration = getMSBuildConfiguration(options),
		vsargs = ' /p:Platform=Win32 /p:Configuration='+configuration;

	programs.msbuild(solutionFile+vsargs, callback, options);
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