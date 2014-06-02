/**
 * windows compiler
 */
var fs = require('fs'),
	path = require('path'),
	UglifyJS = require('uglify-js'),
	hyperloop = require('./dev').require('hyperloop-common'),
	log = hyperloop.log,
	util = hyperloop.util,
	_ = require('underscore'),
	library = require('./library');

exports.initialize = initialize;
exports.finish = finish;
exports.beforeCompile = beforeCompile;
exports.afterCompile = afterCompile;
exports.isValidSymbol = isValidSymbol;
exports.validateSymbols = validateSymbols;
exports.getFileExtension = library.getFileExtension;
exports.getFunctionSymbol = getFunctionSymbol;
exports.getInstanceMethodSymbol = getInstanceMethodSymbol;
exports.getStaticMethodSymbol = getStaticMethodSymbol;
exports.getSetterSymbol = getSetterSymbol;
exports.getGetterSymbol = getGetterSymbol;
exports.defineClass = defineClass;
exports.findProperty = findProperty;

function initialize(options, build_options, arch, sdks, settings, callback) {
	library.loadMetabase(options, arch, sdks, settings, function(err, ast, libfile, astFile){
		return callback(err, {metabase:ast, libfile:libfile});
	});
}

function finish(options, build_opts, arch, state, uncompiledFiles, compiledFiles, callback) {
	callback();
}

function beforeCompile(state, arch, filename, jsfilename, relativeFilename, source) {
	state.symbols = {};
}

function afterCompile(state, arch, filename, jsfilename, relativeFilename, source, sourceAST) {
}

function isValidSymbol(state, name) {
	if (!name) throw new Error("name required");
	var sym = state.metabase.classes[name];
	return !!sym;
}

function findProperty (metabase, classname, property) {
	var cls = metabase.classes[classname];
	if (cls) {
		return cls.properties[property];
	}
	return undefined;
}

function findMethod(metabase, cls, method, args, isInstance, node, nodefail) {
	var entry = metabase.classes[cls],
		methods = _.clone(entry.methods),
		argcount = args.length;

	// search for super classes
	if (!methods[method]) {
		entry = metabase.classes[entry.superClass];
		while(entry) {
			entry.methods && Object.keys(entry.methods).forEach(function(name){
				if (!(name in methods)) {
					methods[name] = entry.methods[name];
				}
			});
			entry = metabase.classes[entry.superClass];
		}
	}

	// match up arg count
	var result = _.filter(methods[method], function(m){
		return m.args.length == argcount && isInstance == (m.attributes.indexOf('instance')>=0);
	});


	if (!result || result.length == 0) {
		return undefined;
	}

	if (result && result.length == 1) {
		return result[0];
	} else {
		var msg = "can't disambiguate arguments for method "+method.yellow,
			help = '  The following method signatures are available:\n\n'.yellow,
			guide = '';
		result.forEach(function(m) {
			guide += '\tHyperloop.method('+util.sanitizeSymbolName(cls).toLowerCase()+', ';
			guide += '\''+method+'(';
			var argt = [];
			m.args.forEach(function(arg) {
				argt.push(arg.type);
			});
			guide += argt.join(',');
			guide += ')\')\n';
		});
		help += guide.red.bold;
		nodefail(node, msg, help);
	}
	return result;
}

function getFunctionSymbol(state, name, symbolname, node, nodefail) {
	//TODO
}

function getInstanceMethodSymbol(state, cls, method, varname, symbolname, node, nodefail) {
	var m = findMethod(state.metabase, cls, method, node.args, true, node, nodefail);
	if (!m) {
		nodefail(node, "couldn't find method: "+method.yellow+" for class: "+cls.yellow);
	}
	return {type:'method',metatype:'instance',symbolname:symbolname,instance:varname,class:cls,name:method,location:node.start,argcount:node.args.length,method:m,returnType:m.returnType};
}

function getStaticMethodSymbol(state, cls, method, symbolname, node, nodefail) {
	var m = findMethod(state.metabase, cls, method, node.args, false, node, nodefail);
	if (!m) {
		nodefail(node, "couldn't find method: "+method.yellow+" for class: "+cls.yellow);
	}
	return {type:'method',metatype:'static',symbolname:symbolname,instance:null,class:cls,name:method,location:node.start,argcount:node.args.length,method:m,returnType:m.returnType};
}

function getSetterSymbol(state, cls, name, instanceName, symbolname, node, nodefail) {
	 var property = findProperty(state.metabase, cls, name);
	return {type:'statement',metatype:'getter',symbolname:symbolname,class:cls,name:name,instance:instanceName,location:node.start,property:property}
}

function getGetterSymbol(state, cls, name, instanceName, symbolname, node, nodefail) {
	var property = findProperty(state.metabase, cls, name);
	return {type:'statement',metatype:'setter',symbolname:symbolname,instance:instanceName,class:cls,name:name,location:node.start,argcount:1,property:property,returnType:property.returnType};
}

function validateSymbols(state, arch, symbols, nodefail) {
	var metabase = state.metabase;
	Object.keys(symbols).forEach(function(key){
		var entry = symbols[key];
		switch (entry.type) {
			case 'function': {
				//TODO
				break;
			}
			case 'constructor': {
				//TODO
				break;
			}
			case 'statement': {
				//TODO
				break;
			}
			case 'method': {
				var method = entry.method;
				if (method && method.args && method.args.length!==entry.argcount) {
					nodefail(entry.location, "wrong number of arguments passed to "+entry.name.yellow);
				}
				break;
			}
		}
	});
}

/**
 * called to define a class
 */
function defineClass(options, state,arch,node,dict,fail) {
	fail(node,"defineClass");
}
