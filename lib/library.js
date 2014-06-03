/**
 * Windows library generation
 */

var fs = require('fs'),
	path = require('path'),
	fs = require('fs'),
	wrench = require('wrench'),
	_ = require('underscore'),
	metabase = require('./metabase'),
	buildlib = require('./buildlib'),
	hyperloop = require('./dev').require('hyperloop-common'),
	util = hyperloop.util, 
	log = hyperloop.log,
	typelib = hyperloop.compiler.type,
	platform_typelib = require('./type'),
	jsgen = hyperloop.compiler.jsgen;

exports.loadMetabase = loadMetabase;
exports.getArchitectures = getArchitectures;
exports.compileLibrary = compileLibrary;
exports.prepareLibrary = prepareLibrary;
exports.generateLibrary = generateLibrary;
exports.generateApp = generateApp;
exports.prepareArchitecture = prepareArchitecture;
exports.prepareClasses = prepareClasses;
exports.prepareFunctions = prepareFunctions;
exports.prepareTypes = prepareTypes;
exports.prepareClass = prepareClass;
exports.prepareFunction = prepareFunction;
exports.prepareMethod = prepareMethod;
exports.prepareProperty = prepareProperty;
exports.prepareType = prepareType;
exports.shouldProcessMethod = shouldProcessMethod;
exports.shouldProcessProperty = shouldProcessProperty;
exports.shouldProcessFunction = shouldProcessFunction;
exports.shouldProcessType = shouldProcessType;
exports.generateMethod = generateMethod;
exports.generateFunction = generateFunction;
exports.generateGetterProperty = generateGetterProperty;
exports.generateSetterProperty = generateSetterProperty;
exports.generateNewInstance = generateNewInstance;
exports.isMethodInstance = isMethodInstance;
exports.isPropertyInstance = isPropertyInstance;
exports.getClassFilename = getClassFilename;
exports.getFunctionsFilename = getFunctionsFilename;
exports.getTypesFilename = getTypesFilename;
exports.getFileExtension = getFileExtension;
exports.getObjectFileExtension = getObjectFileExtension;
exports.getLibraryFileName = getLibraryFileName;
exports.getDefaultLibraryName = getDefaultLibraryName;
exports.prepareHeader = prepareHeader;
exports.prepareFooter = prepareFooter;
exports.getMethodSignature = getMethodSignature;

// classes that we explicitly blacklist
const CLASS_BLACKLIST = [
];

/**
 * called to load the metabase (and generate if needed)
 */
function loadMetabase(options, arch, sdks, settings, callback, generate) {
	metabase.loadMetabase(options,arch,callback);
}

/**
 * return suitable architectures for compiling
 */
function getArchitectures (options, callback) {
	callback(null, ['x86'], {}, {});
}

/** 
 * called once before doing any generation to allow the platform
 * adapter to do any setup before getting started
 */
function prepareLibrary(options, callback) {
	getArchitectures(options,callback);
}

function prepareArchitecture(options, arch, sdks, settings, callback) {
	loadMetabase(options, arch, sdks, settings, callback, true);
}

/**
 * add an extern
 */
function addExtern(state, extern) {
	if (state.externs.indexOf(extern)==-1) {
		extern = /^EXPORTAPI/.test(extern) ? extern : ('EXPORTAPI '+extern);
		state.externs.push(extern);
	}
}

/**
 * called after all files have been processed
 */
function compileLibrary (opts, arch, metabase, callback) {

	var options = _.clone(opts);

	if (options.srcfiles.length) {

		options.cflags = (options.cflags||[])
							.concat([
								'-DHL_WINDOWS=1',
								'-DHL_ARCHITECTURE='+arch,
								'-I"'+options.srcdir+'"',
								'-I"'+options.dest+'"'
							]);
		options.outdir = path.join(options.dest,'build');
		options.linkflags = options.linkflags||[];

		if (options.outdir && !fs.existsSync(options.outdir)) {
			wrench.mkdirSyncRecursive(options.outdir);
		}

		callback(null, options.srcfiles);
	}
	else {
		callback("no source files provided");
	}
}

function generateLibrary (options, arch_results, settings, callback) {
	buildlib.generateLibrary(options, callback);
}

function generateApp (options, arch_results, settings, callback) {
	options.launchToken = options.launchToken || options.name.toLowerCase()+'-'+genLaunchToken();
	buildlib.generateApp(options, arch_results, settings, callback);
}

function genLaunchToken() {
	var str = 'abcdefghijklmnopqrstuvwxyz0123456789',
		max = 5,
		token = '';
	for (var c=0;c<max;c++) {
		token+=str.charAt(Math.round(Math.random()*str.length));
	}
	return token;
}

/**
 * called to prepare and return classes that should be processed 
 * for generation and compilation. should return an array of class names
 * to compile
 */
function prepareClasses(options, state, metabase, library, symboltable) {
	return Object.keys(metabase.classes);
}

/**
 * called to prepare and return functions that should be processed 
 * for generation and compilation. should return an array of function names
 * to compile
 */
function prepareFunctions(options, metabase) {
	return [];
}

/**
 * called to prepare and return types that should be processed 
 * for generation and compilation. should return an array of type names
 * to compile
 */
function prepareTypes(options, metabase) {
	return [];
}

/**
 * called prepare generation of class source code. this method is called
 * once for each file before it is generated.
 */
function prepareClass(options, metabase, state, classname) {
	log.debug('generating class:',classname.green.bold);
}

/**
 * called prepare generation of function source code. this method is called
 * once for each file before it is generated.
 */
function prepareFunction(options, metabase, state, fnname) {
	log.debug('generating function:',fnname.green.bold);
}

/**
 * called prepare generation of type source code. this method is called
 * once for each file before it is generated.
 */
function prepareType(options, metabase, state, type) {
	log.debug('generating type:',type.green.bold);
}

/**
 * called to prepare a class method to be compiled. this method is called once 
 * for each class and each method in each class that will be generated.
 */
function prepareMethod(options, metabase, state, classname, methodname, methods) {
}

/**
 * called to prepare a class property to be compiled. this method is called once
 * for each class and each property in each class that will be generated.
 */
function prepareProperty(options, metabase, state, classname, propertyname, property) {
}

/**
 * returns true if the method should be compiled
 */
function shouldProcessMethod(options, metabase, state, classname, methodname, methods) {
	return true;
}

/**
 * returns true if the property should be compiled
 */
function shouldProcessProperty(options, metabase, state, classname, propertyname, property) {
	return true;
}

/**
 * returns true if the function should be compiled
 */
function shouldProcessFunction(options, metabase, state, fnname, fn) {
	return true;
}

/**
 * returns true if the type should be compiled
 */
function shouldProcessType(options, metabase, state, typename, type) {
	return true;
}

/**
 * generate a function body. call for each function that should be generated.
 */
function generateFunction(options, metabase, state, indent, fnname, fn) {
	var code = [];
	return code.map(function(l) { return indent + l } ).join('\n');
}

/**
 * TODO
 * return a unique name to distinguish between overloaded methods
 */
function getMethodSignature(options, metabase, state, classname, methodname, method) {
	return methodname;
}

/**
 * generate a method body. call for each method that should be generated for a class
 */
function generateMethod(options, metabase, state, indent, varname, classname, method, methodname) {
	var parts = method.args,
		selector = '',
		code = [],
		self = this,
		start =  isMethodInstance(options, metabase, state, method) ? 1 : 0,
		argnames = {},
		cleanup = [];

	method.args.forEach(function(m,i){
		var type = m.type,
			value = parts[i] || m.name+'$'+i,
			typeobj = typelib.resolveType(type), 
			cast = typeobj.isInstanceType() ? classname+' *' : typeobj.toCast();

		// if the variable is named one of our internal variable names, let's mangle it
		if (/^(ctx|function|thisObject|argumentCount|arguments|exception|new|delete|template)$/.test(value)) {
			value = '_'+value;
		}

		// some selectors are repeated so we need to ensure we have unique variable names
		if (value in argnames) {
			value = value + '$'+i;
		}

		argnames[value]=1;

		var argname = typeobj.getRealCast(value);

		if (i>0) {
			selector+=parts[i]+':'+argname+' ';
		}
		else {
			selector+=':'+argname+' ';
		}
		var preamble = [],
			declare = [],
			body = typeobj.getAssignmentCast(typeobj.toNativeBody('arguments['+(i+start)+']',preamble,cleanup,declare));
	
		preamble.length && preamble.forEach(function(c){code.push(indent+c)});
		declare.length && declare.forEach(function(d){addExtern(state,d)});
		code.push(indent+typeobj.getAssignmentName()+' '+value+' = '+body+';');
	});

	var methodBlock = varname+'->'+method.name+'('+selector.trim()+')',
		returnBlock = 'return JSValueMakeUndefined(ctx);',
		methodType = typelib.resolveType(method.returnType);

	if (methodType.isNativeVoid() && !methodType.isPointer()) {
		methodBlock = indent + methodBlock + ';';
	}
	else {
		methodBlock = indent + methodType.getAssignmentName()+' result = '+methodType.getAssignmentCast(methodBlock)+';';
		var rpreamble = [],
			declare = [],
			classObj = typelib.resolveType(classname),
			resultCode = (methodType.isInstanceType() ? classObj : methodType).toJSBody('result', rpreamble, cleanup, declare);
		returnBlock = 'return ' + resultCode + ';';
		rpreamble.length && (methodBlock+='\n'+indent+rpreamble.join('\n'+indent));
		declare.length && (declare.filter(function(c) {return !/instancetype/.test(c);}).forEach(function(d) { addExtern (state, d); }));
	}

	code.push(methodBlock);
	cleanup.forEach(function(c){ code.push(indent+c); });
	code.push(indent+returnBlock);

	return code.join('\n');

}

/**
 * generate the getter property value
 */
function generateGetterProperty(options, metabase, state, library, classname, propertyname, property, varname, cast, indent) {
	var code = [],
		value = 'is_'+propertyname.toLowerCase(),
		method = propertyname,
		classObj = typelib.resolveType(classname),
		typeobj = typelib.resolveType(platform_typelib.sanitizeTypeName(property.returnType)),
		preamble = [],
		cleanup = [],
		declare = [],
		result = typeobj.toJSBody(value,preamble,cleanup,declare),
		assignment;

	if (!isPropertyInstance(options,metabase,state,property)) {
		varname = classObj.toClassName();
		assignment = typeobj.getAssignmentCast(varname+'::'+method);
	} else {
		assignment = typeobj.getAssignmentCast(varname+'->'+method);
	}

	code.push(typeobj.getAssignmentName()+' ' + value + ' = '+assignment+';');
	code.push('result = '+result + ';');

	preamble.length && preamble.forEach(function(c){ code.push(c) });
	cleanup.length && cleanup.forEach(function(c){ code.push(c) });
	declare.length && declare.forEach(function(d){ addExtern(state,d) });

	return code.map(function(l) { return indent + l } ).join('\n');
}

/**
 * generate the setter property
 */
function generateSetterProperty(options, metabase, state, library, classname, propertyname, property, varname, cast, indent) {
	var code = [],
		classObj = typelib.resolveType(classname),
		typeobj = typelib.resolveType(platform_typelib.sanitizeTypeName(property.returnType)),
		preamble = [],
		cleanup = [],
		declare = [],
		result = typeobj.getRealCast(typeobj.toNativeBody('value',preamble,cleanup,declare));

	if (!isPropertyInstance(options,metabase,state,property)) {
		varname = classObj.toClassName();
	}
	preamble.length && preamble.forEach(function(c){ code.push(c) });
	code.push(varname+'->'+propertyname+' = '+result+';');
	cleanup.length && cleanup.forEach(function(c){ code.push(c) });
	code.push('result = JSValueMakeBoolean(ctx,true);');

	declare.length && declare.forEach(function(d){ addExtern(state,d) });

	return code.map(function(l) { return indent + l } ).join('\n');
}

/**
 * return true if the method is an instance method (vs. a static method)
 */
function isMethodInstance (options, metabase, state, method) {
	return method.attributes.indexOf('instance') >= 0;
}

/**
 * return true if the property is an instance property (vs. a static property)
 */
function isPropertyInstance (options, metabase, state, property) {
	return property.metatype == 'instance';
}

/**
 * return the file extension appropriate for the platform. if header is true,
 * return the header file extension, otherwise the implementation file extension
 */
function getFileExtension (header) {
	return header ? '.h' : '.cpp';
}

/**
 * return the object file extension
 */
function getObjectFileExtension() {
	return '.obj';
}

/**
 * return the library file name formatted in a platform specific format
 */
function getLibraryFileName(name) {
	return name+'.dll';
}

/**
 * return the default library name
 */
function getDefaultLibraryName() {
	return getLibraryFileName('hyperloop');
}

function getDefaultAppName() {
	return getLibraryFileName('App');
}

/**
 * return a suitable filename for a given class
 */
function getClassFilename(options, metabase, state, classname) {
	return 'HL_' + classname + getFileExtension(false);
}

/**
 * return the suitable filename
 */
function getFunctionsFilename(options, metabase, state) {
	return 'HL_Functions' + getFileExtension(false);
}

/**
 * return the suitable filename
 */
function getTypesFilename(options, metabase, state) {
	return 'HL_Types' + getFileExtension(false);
}

/**
 * called to generate any code at the header of the class. this method
 * is called once per file
 */
function prepareHeader(options, metabase, state, classname, code) {
	if (state.externs && state.externs.length) {
		code.push('');
		code.push('// externs');
		code.push(state.externs.join('\n'));
	}

	code.push('');
}

/**
 * called to generate any code at the footer of the class. this method
 * is called once per file
 */
function prepareFooter(options, metabase, state, classname, code) {
}

/**
 * generate code for new instance
 */
function generateNewInstance(state, metabase, indent, classname, cast, name) {
	var typeobj = typelib.resolveType(classname),
		typeinfo = metabase.classes[classname],
		code = [];
	if (typeinfo.methods['.ctor']) {
		code.push(cast+' instance = ref new '+typeobj.toClassName()+'();');
	} else {
		code.push(cast+' instance = nullptr;')
	}

	return code.map(function(l) { return indent + l } ).join('\n');
}
