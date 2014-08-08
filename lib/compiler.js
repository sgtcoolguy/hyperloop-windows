/**
 * windows compiler
 */
var fs = require('fs'),
	path = require('path'),
	UglifyJS = require('uglify-js'),
	hyperloop = require('./dev').require('hyperloop-common'),
	log = hyperloop.log,
	util = hyperloop.util,
	jsgen = hyperloop.compiler.jsgen,
	typelib = hyperloop.compiler.type,
	_ = require('underscore'),
	library = require('./library'),
	platform_typelib = require('./type');

exports.initialize = initialize;
exports.finish = finish;
exports.beforeCompile = beforeCompile;
exports.afterCompile = afterCompile;
exports.isValidSymbol = isValidSymbol;
exports.validateSymbols = validateSymbols;
exports.getFileExtension = library.getFileExtension;
exports.getFunctionCallName = getFunctionCallName;
exports.getFunctionSymbol = getFunctionSymbol;
exports.getInstanceMethodSymbol = getInstanceMethodSymbol;
exports.getStaticMethodSymbol = getStaticMethodSymbol;
exports.getConstructorSymbol = getConstructorSymbol;
exports.getSetterSymbol = getSetterSymbol;
exports.getGetterSymbol = getGetterSymbol;
exports.defineClass = defineClass;
exports.defineMethod = defineMethod;
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
	var sym = state.metabase.classes[name] || state.metabase.symbols[name];
	return !!sym;
}

function findProperty (metabase, classname, property) {
	var cls = metabase.classes[classname];
	var p;
	if (!cls) return undefined;

	if (cls.properties) {
		p = cls.properties[property];
	} else if (cls.fields) {
		p = cls.fields[property];
	}
	var superClass = cls.extends;
	if (!p && superClass) {
		return findProperty(metabase, superClass, property);
	}
	return p;
}


/*
 * get method with given name.
 * this doesn't count on any arguments and signatures and could return multple symbols
 */
function findMethods(metabase, cls, method) {
	var entry = metabase.classes[cls],
		methods = entry.methods;

	// search for super classes
	if (!methods[method]) {
		var _extends = platform_typelib.sanitizeTypeName(entry.extends);
		entry = metabase.classes[_extends];
		while(entry) {
			entry.methods && Object.keys(entry.methods).forEach(function(name){
				if (!(name in methods)) {
					methods[name] = entry.methods[name];
				}
			});
			_extends = platform_typelib.sanitizeTypeName(entry.extends);
			entry = metabase.classes[_extends];
		}
	}	

	return methods[method];
}

function findMethod(metabase, cls, method, args, isInstance, node, nodefail) {
	var entry = metabase.classes[cls];
	if (!entry) return undefined;
	var methods = _.clone(entry.methods),
		argcount = args.length;

	// search for super classes
	if (!methods[method]) {
		var _extends = platform_typelib.sanitizeTypeName(entry.extends);
		entry = metabase.classes[_extends];
		while(entry) {
			entry.methods && Object.keys(entry.methods).forEach(function(name){
				if (!(name in methods)) {
					methods[name] = entry.methods[name];
				}
			});
			_extends = platform_typelib.sanitizeTypeName(entry.extends);
			entry = metabase.classes[_extends];
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

function findConstructor (metabase, cls, args, node, nodefail) {
	return findMethod(metabase, cls, ".ctor", args, true, node, nodefail);
}

function getFunctionCallName(state,name,node) {
	if (name == 'create_task') {
		var method = node.args[0].hyperloop.method;
		var returnType = typelib.resolveType(method.returnType);
		if (returnType._is_windows_async) {
			return name+'_'+util.sanitizeSymbolName(returnType._generic_sanitized_type)+'_function';
		} else {
			log.fatal('Unknown async type: '+returnType.toName());
		}
	}
	return jsgen.generateFunctionCallName(name);
}

function updateSymbolForAsync(state,name,node,fn) {
	if (name == 'create_task') {
		var method = node.args[0].hyperloop.method;
		var returnType = typelib.resolveType(method.returnType);
		if (returnType._is_windows_async) {
			fn.name = name+'_'+util.sanitizeSymbolName(returnType._generic_sanitized_type);
			fn.returnType = returnType._generic_sanitized_type;
			fn.returnTypeAsync = returnType;
		}
	}
}

function getFunctionSymbol(state, name, symbolname, node, nodefail) {
	var fn = _.clone(state.metabase.symbols[name]);
	updateSymbolForAsync(state,name,node,fn);
	if (fn.arguments && !fn.args) {
		fn.args = fn.arguments;
	}
	return {type:'function',symbolname:symbolname,argcount:node.args.length,function:fn,returnType:fn.returnType,location:node.start};
}

function getInstanceMethodSymbol(state, cls, method, varname, symbolname, node, nodefail) {
	var m = findMethod(state.metabase, cls, method, node.args, true, node, nodefail);
	if (!m) {
		// Commenting for now.
		// This checks if an object has a function. But what if that native object
		// does not have a function but it's JS object does?
		// For example:
		//		var button = new UIButton();
		//		button.saySomething = function() { };
		//
		return undefined;	
	}
	return {type:'method',metatype:'instance',symbolname:symbolname,instance:varname,class:cls,name:method,location:node.start,argcount:node.args.length,method:m,returnType:m.returnType};
}

function getConstructorSymbol(state, cls, node, nodefail) {
	// struct classes doesn't have constructor information
	var typeobj = typelib.resolveType(cls),
		symbolname = jsgen.generateNewConstructorName(cls, "constructor");
	if (typeobj.isWindowsValueType()) {
		return {type:'constructor',metatype:'constructor',symbolname:symbolname,class:cls,location:node.start,argcount:node.args.length};
	} else {
		var m = findConstructor(state.metabase, cls, node.args, node, nodefail);
		if (!m) {
			nodefail(node, "couldn't find constructor for class: "+cls.yellow+" with argcount "+node.args.length.toString().yellow);
		}
		return {type:'constructor',metatype:'constructor',symbolname:symbolname,class:cls,location:node.start,argcount:node.args.length,method:m,selector:symbolname};
	}
}

function getStaticMethodSymbol(state, cls, method, symbolname, node, nodefail) {
	var m = findMethod(state.metabase, cls, method, node.args, false, node, nodefail);
	if (!m) {
		nodefail(node, "couldn't find method: "+method.yellow+" for class: "+cls.yellow);
	}
	return {type:'method',metatype:'static',symbolname:symbolname,instance:null,class:cls,name:method,location:node.start,argcount:node.args.length,method:m,returnType:m.returnType};
}

function getSetterSymbol(state, cls, name, instanceName, symbolname, node, nodefail) {
	var property = _.clone(findProperty(state.metabase, cls, name));
	// TODO consider common metabase structure
	property.metatype = property.type;
	if (property.returnType) {
		property.type = platform_typelib.sanitizeTypeName(property.returnType); // Used by generateCodeDependencies
	} else {
		property.type = platform_typelib.sanitizeTypeName(property.type);
	}
	return {type:'statement',metatype:'setter',symbolname:symbolname,class:cls,name:name,instance:instanceName,location:node.start,property:property};
}

function getGetterSymbol(state, cls, name, instanceName, symbolname, node, nodefail) {
	var property = _.clone(findProperty(state.metabase, cls, name));
	// TODO consider common metabase structure
	property.metatype = property.type;
	if (property.returnType) {
		property.type = platform_typelib.sanitizeTypeName(property.returnType);
	} else {
		property.type = platform_typelib.sanitizeTypeName(property.type);
	}
	return {type:'statement',metatype:'getter',symbolname:symbolname,instance:instanceName,class:cls,name:name,location:node.start,argcount:1,property:property,returnType:property.type};
}

function validateSymbols(state, arch, symbols, nodefail) {
	var metabase = state.metabase;
	Object.keys(symbols).forEach(function(key){
		var entry = symbols[key];
		switch (entry.metatype) {
			case 'function': {
				var fn = entry.function;
				if (!fn) {
					nodefail(entry.location, "couldn't find function named: "+key.yellow);
				}
				if (entry.function.formatter) {
					if (entry.argcount<=1) {
						nodefail(entry.location, "wrong number of arguments passed to "+fn.name.yellow+". expected a format as the first argument of type: "+fn.formatter.type.yellow+" and 1 or more subsequent arguments");
					}
				}
				else {
					if (fn.arguments.length!==entry.argcount) {
						nodefail(entry.location, "wrong number of arguments passed to "+fn.name.yellow+". expected "+fn.arguments.length+" but received "+entry.argcount);
					}
				}
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

/**
 * called to define a overloaded method
 */
function defineMethod(options,state,arch,node,dict,fail) {
	var varname = dict.method[0].value,
		callstr = dict.method[1].value,
		start = node.start.pos,
		distance = -Number.MAX_VALUE,
		match = callstr.match(/(.+)(\()(.+)(\))/),
		vardef,
		isConstructor = false,
		classname,
		entry;

	if (!fail) fail = log.fatal;

	if (!match) {
		return fail(node,callstr+' of '+classname+' is not a valid method call');
	}

	// look up the type for the definition
	Object.keys(state.node_map).forEach(function(key) {
		var def = JSON.parse(key);
		// check the distance from the definition, pick up negative nearest one
		if (def.type === 'name' && def.value === varname) {
			var d = def.endpos - start;
			if (d > distance) {
				distance = d;
				vardef = state.node_map[key];
			}
		}
	});

	if (vardef && (vardef.returnType || vardef['class'])) {
		classname = vardef.returnType || vardef['class'];
	} else {
		entry = state.metabase.classes[varname];
		if (entry) {
			classname = varname;
		} else {
			log.debug(state.node_map);
			throw new Error('failed to lookup definition of '+varname);
		}
	}

	// look up matching method
	var method     = match[1],
		methodargs = match[3].split(','),
		methods = findMethods(state.metabase, classname, method);

	if (!methods) {
		return fail(node,"couldn't find method:",method.yellow,"for class:",classname.yellow);
	}

	isConstructor = (method == '.ctor');

	var signature, index;
	for (var i = 0; i < methods.length; i++) {
		var m = methods[i];
		if (m.args.length === 0) continue;
		for (var j = 0; j < m.args.length; j++) {
			var a = platform_typelib.sanitizeTypeName(m.args[j].type);
			var b = platform_typelib.sanitizeTypeName(methodargs[j]);
			if (a != b) break;
		}
		// if all matched, this is the one
		if (j == m.args.length) {
			signature = '_'+util.sanitizeSymbolName(methodargs.join('_'));
			index = i;
			break;
		}
	}

	if (!signature) {
		return fail(node,"couldn't find method: "+method.yellow+" for class: "+classname.yellow);
	}

	var methodname = method,
		fn,
		methodObj = state.metabase.classes[classname].methods[methodname][index];

	if (!methodObj) {
		return fail(node,"couldn't find method: "+methodname.yellow+" for class: "+classname.yellow);
	}

	if (isConstructor) {
		fn = jsgen.generateNewConstructorName(classname, 'constructor')+signature;
	} else {
		fn = jsgen.generateMethodName(classname, methodname)+signature;
	}

	var key = state.obfuscate ? jsgen.obfuscate(fn) : fn,
			node_start = JSON.stringify(node.start);

	if (isConstructor) {
		var argcount = callstr.split(',').length+1;

		// register method symbol
		state.symbols[key] = {type:'constructor',metatype:'constructor',
			method:methodObj,name:method,symbolname:fn,class:classname,
			location:node.start,argcount:argcount,selector:callstr,returnType:classname};
		state.node_map[node_start] = state.symbols[key];

		// save constructor information to make it easy to search later on
		state.constructors = state.constructors || {};
		state.constructors[classname] = state.constructors[classname] || {};
		state.constructors[classname][key] = state.symbols[key];		
	} else {
		state.symbols[key] = {type:'method',metatype:'instance',symbolname:fn,instance:varname,returnType:methodObj.returnType,
						class:classname,name:methodname+signature,location:node.start,argcount:methodargs.length,
						method:_.clone(methodObj)};

		// we need to place the instance name as the first parameter in the argument list
		if (library.isMethodInstance(options,state.metabase,state,methodObj)) {
			dict.call.unshift({type:'variable',value:varname});
		}
	}
	// return the name and args to use
	return {
		start: JSON.parse(node_start),
		args: dict.call,
		name: key
	};
}

