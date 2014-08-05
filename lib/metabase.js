var fs = require('fs'),
	path = require('path'),
	ilparser = require('./ilparser'),
	hparser = require('./hparser'),
	finder = require('./finder'),
	programs = require('./programs'),
	async = require('async'),
	hyperloop = require('./dev').require('hyperloop-common'),
	log = hyperloop.log,
	util = hyperloop.util;

// module interface
exports.loadMetabase = loadMetabase;

/**
 * Loads the metabase either from the cache, or creates a new one.
 * On success, the callback will be executed with a JSON representation
 *
 * @returns {void}
 */
function loadMetabase(options, arch, callback) {
	var cacheFile = path.join(options.dest,'metabase-windows-'+arch+'.json');
	if (fs.existsSync(cacheFile) && !options.force) {
		return fs.readFile(cacheFile, function(err,buffer){
			if (err) {
				return callback(err);
			}
			return callback(null, JSON.parse(buffer.toString()));
		});
	}
	var metabase = {},
		tasks = [],
		systemWinMDS = ['platform','Windows'],
		includes = options.includes;

	// load header files
	includes.forEach(function(name) {
		tasks.push(function(next) {
			loadHeaderFile(options,metabase,name,next);
		});
	});

	// load and parse various winmd files
	systemWinMDS.forEach(function(name){
		tasks.push(function(next){
			loadWinMD(options,name,next);
		});
	});
	// merge together the metabases
	async.series(tasks, function(err,results) {
		log.info('merging',systemWinMDS.length,'metabases');
		results.forEach(function(entry) {
			if (metabase) {
				Object.keys(entry).forEach(function(key){
					var target = metabase[key],
						source = entry[key];
					Object.keys(source).forEach(function(k){
						metabase[key][k] = source[k];
					});
				});
			}
			else {
				metabase = entry;
			}
		});
		// write out cached file
		fs.writeFile(cacheFile, JSON.stringify(metabase,null,3), function(err) {
			callback(err,metabase);
		});
	});
}

function loadHeaderFile(options,metabase,name,callback) {
	var headerPath = hparser.findHeader(options, name);
	hparser.parseHeader(options, options.I, name, headerPath, function(err,json) {
		hparser.mixInAST(json, metabase);	
		callback(null, metabase);
	});
}

function loadWinMD(options, name, callback) {
	var ref = finder.find(name+'.winmd', options.sdk);
	if (!ref) {
		log.error('Failed to find '+name+'.');
		log.fatal('Please create an issue at https://github.com/appcelerator/hyperloop/issues/new.');
	}
	log.info('converting '+name+'.winmd to IL to generate metabase');
	programs.ildasm(ref, name+'.il', function(err, ref) {
		if (err) {
			log.error('Failed to ildasm the '+name+': ildasm.exe failed.');
			log.fatal(err);
		}
		log.info('parsing '+name+'.winmd to generate metabase');
		ilparser.parseFile(ref, function(err, ast) {
			if (err) {
				log.error('Failed to parse the output from ildasm.');
				log.fatal(err);
			}
			var metabase = ast.toJSON();
			callback(null,metabase);
		});
	});
}