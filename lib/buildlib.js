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

exports.generateLibrary = generateLibrary;
exports.generateApp = generateApp;
exports.generateAppLib = generateAppLib;
exports.getMSBuildConfiguration = getMSBuildConfiguration;
exports.getMSBuildTarget = getMSBuildTarget;

var BINARY_FILE_EXTENSIONS = ['exe','lib','dll','pfx','png','gif','jpg'],
	binaryFilesRE = new RegExp('\.('+BINARY_FILE_EXTENSIONS.join('|')+')$'),
	srcFilesRE = new RegExp('\.(cpp|c)$'),
	headerFilesRE = new RegExp('\.(hpp|h)$'),
	ignoreFilesRE = /(\.(git|svn|cvs))|(Thumbs\.db)|(\.suo)/;

function generateLibrary(options, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12update2', 'hyperloop'),
		builddir = path.join(getMSBuildBase(options),'hyperloop'),
		copybase = path.join(builddir, 'hyperloop', 'hyperloop.Shared');

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
			clcompiles += '    <ClCompile Include="$(MSBuildThisFileDirectory)'+path.relative(todir, from)+'" />\r\n';
		} else if (headerFilesRE.test(from)) {
			clincludes += '    <ClInclude Include="$(MSBuildThisFileDirectory)'+basename+'" />\r\n';
			log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(copybase,to));
			if (!fs.existsSync(todir)) {
				wrench.mkdirSyncRecursive(todir);
			}
			fs.writeFileSync(to, fs.readFileSync(from));
		}
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

	var jsCoreDirFrom = path.join(__dirname, '..', 'templates', 'JavaScriptCore'),
		jsCoreDirTo = path.join(copybase, 'JavaScriptCore');
	copyHeaderFiles(jsCoreDirFrom, jsCoreDirTo);

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$HYPERLOOP_CLCOMPILES\\$': clcompiles,
		'\\$HYPERLOOP_CLINCLUDES\\$': clincludes
	};

	copyAndFilterString(options, templatedir, builddir, filterValues);

	var solutionFile = path.join(builddir, 'hyperloop.sln'),
		configuration = getMSBuildConfiguration(options),
		vsargs = ' '+getMSBuildTarget(options, 'hyperloop\\hyperloop')+' /p:Configuration='+configuration;

	programs.msbuild(solutionFile+vsargs, callback, options);
}

function getMSBuildTarget(options, name) {
	var platform;
	if (options.arch.match(/^arm/)) {
		platform = 'ARM';
	} else {
		platform = 'Win32';
	}
	return '/t:'+name+'_'+options.target+' /p:Platform='+platform;
}

function getMSBuildBase(options) {
	return path.join(options.dest, 'vsstudio');
}

function getLibraryOutputPath(options, name) {
	var base = path.join(getMSBuildBase(options),name),
		configuration = getMSBuildConfiguration(options),
		dest = options.arch.match(/^arm/) ? path.join('ARM',configuration) : configuration;
	return path.join(base, dest);
}

function getMSBuildConfiguration(options) {
	if (options.environment == 'production') {
		return 'Release';
	}
	return 'Debug';
}

function copyHeaderFiles(fromDir, toDir) {
	if (!fs.existsSync(toDir)) {
		wrench.mkdirSyncRecursive(toDir);
	}
	fs.readdirSync(fromDir).forEach(function(f) {
		if (headerFilesRE.test(f)) {
			var from = path.join(fromDir, f),
				to = path.join(toDir, path.basename(f));
			log.debug('Copying',f,'to',toDir);
			fs.writeFileSync(to, fs.readFileSync(from));
		}
	});
}

function generateApp(options, arch_results, settings, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12update2', 'main'),
		builddir = path.join(getMSBuildBase(options),options.name),
		copybase = path.join(builddir, options.name, options.name+'.Shared'),
		solutionFile = path.join(builddir, options.name+'.sln'),
		configuration = getMSBuildConfiguration(options),
		libapp = 'lib'+options.name,
		vsargs = ' '+getMSBuildTarget(options,options.name+'\\'+options.name)+' /p:Configuration='+configuration,
		clcompiles = '',
		applib =  getLibraryOutputPath(options, libapp),
		applib_windows = path.resolve(path.join(applib, options.name+'.Windows')),
		applib_windowsphone = path.resolve(path.join(applib, options.name+'.WindowsPhone')),
		applib_bin_windows = options.name+'.Windows.lib',
		applib_bin_windowsphone = options.name+'.WindowsPhone.lib';

	if (!fs.existsSync(copybase)) {
		wrench.mkdirSyncRecursive(copybase);
	}

	// copy all header files in libApp
	copyHeaderFiles(path.join(getMSBuildBase(options),libapp,options.name,options.name+'.Shared'), copybase);

	// collect app library source files into main project, that makes it easy to debug from IDE
	if (options.windows_no_applib) {
		var appsrccache = path.join(options.dest,'src',options.arch,'srccache.json'),
			appSources = JSON.parse(fs.readFileSync(appsrccache, 'utf8'));
		Object.keys(appSources).forEach(function(from) {
			var basename = path.basename(from),
				to = path.join(copybase, basename),
				todir = path.dirname(to);
			if (srcFilesRE.test(from)) {
				clcompiles += '    <ClCompile Include="$(MSBuildThisFileDirectory)'+path.relative(todir, from)+'" />\r\n';
			}
		});
		applib_windows = '';
		applib_windowsphone = '';
		applib_bin_windows = '';
		applib_bin_windowsphone = '';
	}

	var jsCoreDirFrom = path.join(__dirname, '..', 'templates', 'JavaScriptCore'),
		jsCoreDirTo = path.join(copybase, 'JavaScriptCore');
	copyHeaderFiles(jsCoreDirFrom, jsCoreDirTo);

	options['identity-name'] = options['identity-name'] || 'hyperlooptest.' + options.name;

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$APPLAUNCHTOKEN\\$': options.launchToken,
		'\\$IDENTITY_NAME\\$': options['identity-name'],
		'\\$CERTNAME\\$': options.certname,
		'\\$HYPERLOOP_LIB\\$': path.resolve(getLibraryOutputPath(options,'hyperloop')),
		'\\$APP_LIB_BIN_WINDOWS\\$': applib_bin_windows,
		'\\$APP_LIB_BIN_WINDOWSPHONE\\$': applib_bin_windowsphone,
		'\\$APP_LIB_WINDOWS\\$': applib_windows,
		'\\$APP_LIB_WINDOWSPHONE\\$': applib_windowsphone,
		'\\$APP_CLCOMPILES\\$': clcompiles
	};

	fs.writeFileSync(path.join(options.dest, 'appinfo.json'), 
				JSON.stringify({sln:solutionFile, token:options.launchToken, identity:options['identity-name']}));

	copyAndFilterString(options, templatedir, builddir, filterValues);

	callback(null, solutionFile);
}

function generateAppLib(options, arch_results, settings, callback) {
	var templatedir = path.join(__dirname, '..', 'templates','vs12update2', 'app'),
		builddir = path.join(getMSBuildBase(options), 'lib'+options.name),
		copybase = path.join(builddir, options.name, options.name+'.Shared');

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
			clcompiles += '    <ClCompile Include="$(MSBuildThisFileDirectory)'+path.relative(todir, from)+'" />\r\n';
			} else if (headerFilesRE.test(from)) {
				clincludes += '    <ClInclude Include="$(MSBuildThisFileDirectory)'+basename+'" />\r\n';
			log.debug('Copying',path.relative(options.srcdir,from),'to',path.relative(copybase,to));
			if (!fs.existsSync(todir)) {
				wrench.mkdirSyncRecursive(todir);
			}
			fs.writeFileSync(to, fs.readFileSync(from));
		}
	});

	// copy all header files in hyperloop
	copyHeaderFiles(path.join(getMSBuildBase(options),'hyperloop','hyperloop','hyperloop.Shared'), copybase);

	// copy JavaScriptCore headers
	var jsCoreDirFrom = path.join(__dirname, '..', 'templates', 'JavaScriptCore'),
		jsCoreDirTo = path.join(copybase, 'JavaScriptCore');
	copyHeaderFiles(jsCoreDirFrom, jsCoreDirTo);

	var filterValues = {
		'\\$APPNAME\\$':options.name,
		'\\$APP_CLCOMPILES\\$': clcompiles,
		'\\$APP_CLINCLUDES\\$': clincludes
	};

	copyAndFilterString(options, templatedir, builddir, filterValues);

	// debug options to skip applib, and build everthing in main project
	if (options.windows_no_applib) {
		return callback();
	}
	
	var solutionFile = path.join(builddir, options.name+'.sln'),
		configuration = getMSBuildConfiguration(options),
		vsargs = ' '+getMSBuildTarget(options,options.name+'\\'+options.name)+' /p:Configuration='+configuration;

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