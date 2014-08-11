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
	programs = require('./programs'),
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
exports.generateCodeDependencies = generateCodeDependencies;
exports.packageApp = packageApp;

// classes that we explicitly blacklist
const CLASS_BLACKLIST = [
];

function prepareIncludeOption(options) {
	// header search path
	if (!options.I) {
		options.I = [];
	}
	if (typeof(options.I) == 'string') {
		options.I = [options.I];
	}
	if (!options.includes) {
		options.includes = [];
	}
	if (typeof(options.includes) == 'string') {
		options.includes = [options.includes];
	}
}

/**
 * called to load the metabase (and generate if needed)
 */
function loadMetabase(options, arch, sdks, settings, callback, generate) {
	prepareIncludeOption(options);
	metabase.loadMetabase(options,arch,callback);
}

/**
 * return suitable architectures for compiling
 */
function getArchitectures (options, callback) {
	callback(null, [options.arch], {}, {});
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
	buildlib.generateAppLib(options, arch_results, settings, function(err) {
		if (err) return callback(err);
		buildlib.generateApp(options, arch_results, settings, callback);
	});
}

function packageApp(options, solutionFile, callback) {
	var targetname = options.name+'.'+options.target;
	var projfile = path.join(path.dirname(solutionFile), options.name, targetname, targetname+'.vcxproj'),
		vsargs = ' /t:Clean;Build /p:Configuration='+buildlib.getMSBuildConfiguration(options)+';Platform='+buildlib.getPlatformTarget(options);
	programs.msbuild(projfile+vsargs, callback, options);
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
function prepareFunctions(options,state,metabase,library,code,functions) {
	if (options.includes) {
		options.includes.forEach(function(i) {
			code.push('#include <'+i+'.h>');
		});
		code.push('');
	}
	if (functions) {
		functions.forEach(function(fn) {
			if (fn.returnTypeAsync) {
				var extern1 = 'EXPORTAPI '+fn.returnTypeAsync._windows_generic_wintype+' JSValueTo_'+fn.returnTypeAsync._windows_generic_ctype+'(JSContextRef,JSValueRef,JSValueRef*);';
				var extern2 = 'EXPORTAPI JSValueRef '+fn.returnTypeAsync._windows_generic_ctype+'_ToJSValue(JSContextRef,'+fn.returnTypeAsync._windows_generic_wintype+', JSValueRef*);';
				code.push(extern1);
				code.push(extern2);
				var args = _.initial(fn.returnTypeAsync._windows_generic_args);
				args.forEach(function(arg) {
					var type = typelib.resolveType(arg);
					code.push(type.toJSExtern());
				});
			}
		});
	}
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

function generateAsyncFunction(options, metabase, state, indent, fnname, fn) {
	var code = [];
	code.push('if (argumentCount < 2) return JSValueMakeUndefined(ctx);');
	code.push('auto arg$0 = '+'JSValueTo_'+fn.returnTypeAsync._windows_generic_ctype+'(ctx,arguments[0],exception);');
	code.push('auto task = concurrency::create_task(arg$0);');
	code.push('auto gctx = HyperloopGlobalContext();');
	code.push('auto cb  = JSValueToObject(ctx, arguments[1], exception);');
	code.push('auto cbe = argumentCount > 2 ? JSValueToObject(ctx, arguments[2], exception) : nullptr;');
	code.push('JSValueProtect(gctx, cb);');
	code.push('JSValueProtect(gctx, thisObject);');
	code.push('if (cbe) JSValueProtect(gctx, cbe);');
	code.push('task.then([gctx, cb, cbe, thisObject]('+_.initial(fn.returnTypeAsync._windows_generic_winargs).map(function(t,i){return t+' cb$in$arg'+i;}).join(',')+') {');
	code.push('JSValueRef cb$exception = JSValueMakeNull(gctx);');
	var args = _.initial(fn.returnTypeAsync._windows_generic_args);
	code.push('\tJSValueRef cb$out['+args.length+'];');
	args.forEach(function(arg,i) {
		var type = typelib.resolveType(arg);
		code.push('\tauto cb$out$arg'+i+' = '+type.toJSValueName()+'(gctx, cb$in$arg'+i+', &cb$exception);');
		code.push('\tcb$out['+i+'] = cb$out$arg'+i+';');
	});
	code.push('\tJSValueRef result = JSObjectCallAsFunction(gctx, cb, thisObject, '+args.length+', cb$out, &cb$exception);');
	code.push('\tJSValueUnprotect(gctx, cb);');
	code.push('\tif (cbe) JSValueUnprotect(gctx, cbe);');
	code.push('\tJSValueUnprotect(gctx, thisObject);');
	code.push('})');
	code.push('.then([gctx, cb, cbe, thisObject](concurrency::task<void> t) {');
	code.push('\tPlatform::String ^err;');
	code.push('\ttry');
	code.push('\t{');
	code.push('\t\tt.get();');
	code.push('\t}');
	code.push('\tcatch (Platform::Exception^ e) {');
	code.push('\t\terr = e->Message;');
	code.push('\t}');
	code.push('\tcatch (const std::exception& ex) {');
	code.push('\t\terr = HyperloopWindowsGetPlatformString(ex.what());');
	code.push('\t}');
	code.push('\tcatch (const std::string& ex) {');
	code.push('\t\terr = HyperloopWindowsGetPlatformString(ex);');
	code.push('\t}');
	code.push('\tcatch (...) {');
	code.push('\t\terr = "Unexpected exception caught when running then();";');
	code.push('\t}');
	code.push('\tif (err)');
	code.push('\t{');
	code.push('\t\tif (cbe)');
	code.push('\t\t{');
	code.push('\t\t\tJSValueRef cb$out[1];');
	code.push('\t\t\tcb$out[0] = HyperloopWindowsGetJSValueRef(gctx, err);');
	code.push('\t\t\tJSObjectCallAsFunction(gctx, cbe, thisObject, 1, cb$out, NULL);');
	code.push('\t\t\tJSValueUnprotect(gctx, cbe);');
	code.push('\t\t}');
	code.push('\t\tJSValueUnprotect(gctx, cb);');
	code.push('\t\tJSValueUnprotect(gctx, thisObject);');	
	code.push('\t}');
	code.push('});');

	code.push('return JSValueMakeUndefined(ctx);');
	return code.map(function(l) { return indent + l } ).join('\n');
}

/**
 * generate a function body. call for each function that should be generated.
 */
function generateFunction(options, metabase, state, indent, fnname, fn) {
	if (fn.returnTypeAsync) {
		return generateAsyncFunction(options,metabase,state,indent,fnname,fn);
	}
	var code = [],
		typeobj = typelib.resolveType(fn.returnType),
		varname = 'var_'+util.sanitizeSymbolName(typeobj.toName()).toLowerCase(),
		cleanup = [],
		methodBlock = '',
		returnBlock = 'return JSValueMakeUndefined(ctx);';

	var selector = generateMethodArguments(options,metabase,state,fn,typelib,false,code,cleanup,'');

	if (typeobj.isNativeStruct() || typeobj.isNativeUnion()) {
		code.push(typeobj.toName()+' '+varname+' = '+fnname+'('+selector+');');
	} else if (typeobj.isNativeVoid()) {
		methodBlock = fnname+'('+selector+');';
	} else {
		methodBlock = typeobj.toCast()+' '+varname+' = '+fnname+'('+selector+');';
	}

	if (!typeobj.isNativeVoid()) {
		var rpreamble = [],
			declare = [],
			resultCode = typeobj.toJSBody(varname, rpreamble, cleanup, declare);
		returnBlock = 'return ' + resultCode + ';';
		rpreamble.length && (methodBlock+='\n'+indent+rpreamble.join('\n'+indent));
		declare.length && (declare.filter(function(c) {return !/instancetype/.test(c);}).forEach(function(d) { addExtern (state, d); }));
	}

	code.push('try {');
	code.push(methodBlock);
	cleanup.forEach(function(c){ code.push(c); });
	code.push(returnBlock);
	insertExceptionBlock(indent, code);

	return code.map(function(l) { return indent + l } ).join('\n');
}

function insertExceptionBlock(indent,code) {
	code.push(indent+'} catch (Platform::Exception ^ex) {');
	code.push(indent+'\t*exception = HyperloopMakeException(ctx, HyperloopWindowsGetCStr(ex->Message));');
	code.push(indent+'\treturn JSValueMakeUndefined(ctx);');
	code.push(indent+'}');
}

/**
 * TODO
 * return a unique name to distinguish between overloaded methods
 */
function getMethodSignature(options, metabase, state, classname, methodname, method) {
	return methodname;
}

function generateMethodArguments(options,metabase,state,method,typelib,instance,code,cleanup,indent) {
	var selector = '',
		start =  instance ? 1 : 0;
	method.args.forEach(function(m,i){
		var type = m.type,
			value = m.name+'$'+i,
			typeobj = typelib.resolveType(type), 
			cast = typeobj.toCast(),
			starti = i+start;

		// if the variable is named one of our internal variable names, let's mangle it
		if (/^(ctx|function|thisObject|argumentCount|arguments|exception|new|delete|template)$/.test(value)) {
			value = '_'+value;
		}

		var argname = typeobj.getRealCast(value);

		if (i === 0) {
			selector+=(typeobj._isAddress ? '&' : '')+argname;
		}
		else {
			selector+=', '+(typeobj._isAddress ? '&' : '')+argname;
		}
		var preamble = [],
			declare = [],
			body = typeobj.getAssignmentCast(typeobj.toNativeBody('arguments['+starti+']',preamble,cleanup,declare)),
			delegate_body;

		if (typeobj.isWindowsDelegate()) {
			delegate_body = typeobj.getAssignmentCast(typeobj.toNativeBody('js'+value,preamble,cleanup,declare));
		}


		if (typeobj._isAddress) {
			cleanup.push('// update pointer inside the JSValueRef because '+argname+' may be updated by the function');
			cleanup.push('Update_'+typeobj.toJSValueName()+'(ctx, '+argname+', arguments['+starti+'], exception);');
		}

		preamble.length && preamble.forEach(function(c){'\t'+code.push(c)});
		declare.length && declare.forEach(function(d){addExtern(state,d)});

		if (typeobj.isWindowsDelegate()) {
			var classname = typeobj.toName(),
				constructor = jsgen.generateNewConstructorName(classname);
			code.push('\t'+typeobj.toCast()+' '+value+';');
			code.push('\tif (JSObjectIsFunction(ctx, JSValueToObject(ctx,arguments['+starti+'],NULL)))');
			code.push('\t{');
			code.push(generateNewInstance(state, metabase, '\t\t', classname, typeobj.toCast(), value, {}, true));
			code.push('\t}');
			code.push('\telse');
			code.push('\t{');
			code.push('\t\t'+value+' = '+body+';');
			code.push('\t}');

			addExtern(state, 'JSValueRef '+constructor+'(JSContextRef,JSObjectRef,JSObjectRef,size_t,const JSValueRef[],JSValueRef*);');

			// save constructor information to make it easy to search later on
			state.constructors = state.constructors || {};
			state.constructors[classname] = state.constructors[classname] || {};
			state.symbols[constructor] = {
				type:'constructor',metatype:'constructor',
				name:'.ctor',symbolname:constructor,class:classname,
				argcount:1,returnType:classname};
			state.constructors[classname][constructor] = state.symbols[constructor];
		} else {
			code.push('\t'+typeobj.getAssignmentName()+' '+value+' = '+body+';');
		}
	});

	return selector;
}

/**
 * generate a method body. call for each method that should be generated for a class
 */
function generateMethod(options, metabase, state, indent, varname, classname, method, methodname) {
	var	code = [],
		cleanup = [],
		instance =  isMethodInstance(options, metabase, state, method);

	var selector = generateMethodArguments(options,metabase,state,method,typelib,instance,code,cleanup,indent);

	var methodBlock,
		returnBlock = 'return JSValueMakeUndefined(ctx);',
		methodType = typelib.resolveType(method.returnType),
		classObj = typelib.resolveType(classname);

	if (instance) {
		if (method.name.match(/^add_/)) {
			methodBlock = varname+'->'+method.name.replace(/^add_/,'')+' += '+selector.trim();
		} else if (method.name.match(/^remove_/)) {
			methodBlock = varname+'->'+method.name.replace(/^remove_/,'')+' -= '+selector.trim();
		} else {
			methodBlock = varname+'->'+method.name+'('+selector.trim()+')';
		}
	} else {
		methodBlock = classObj.toClassName()+'::'+method.name+'('+selector.trim()+')';
	}

	if (methodType.isNativeVoid() && !methodType.isPointer()) {
		methodBlock = indent + methodBlock + ';';
	}
	else {
		methodBlock = indent + methodType.getAssignmentName()+' result = '+methodType.getAssignmentCast(methodBlock)+';';
		var rpreamble = [],
			declare = [],
			classObj = typelib.resolveType(classname),
			resultCode = methodType.toJSBody('result', rpreamble, cleanup, declare);
		returnBlock = 'return ' + resultCode + ';';
		rpreamble.length && (methodBlock+='\n'+indent+rpreamble.join('\n'+indent));
		declare.length && (declare.filter(function(c) {return !/instancetype/.test(c);}).forEach(function(d) { addExtern (state, d); }));
	}

	code.push('try {');
	code.push(methodBlock);
	cleanup.forEach(function(c){ code.push(indent+c); });
	code.push(indent+returnBlock);
	insertExceptionBlock(indent, code);

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
		typeobj = typelib.resolveType(platform_typelib.sanitizeTypeName(property.type)),
		preamble = [],
		cleanup = [],
		declare = [],
		result = typeobj.toJSBody(value,preamble,cleanup,declare),
		assignment;

	if (!isPropertyInstance(options,metabase,state,property)) {
		varname = classObj.toClassName();
		assignment = typeobj.getAssignmentCast(varname+'::'+method);
	} else if (classObj.isWindowsValueType()) {
		assignment = typeobj.getAssignmentCast(varname+'->'+method);
	} else {
		assignment = typeobj.getAssignmentCast(varname+'->'+method);
	}

	code.push('try {');
	code.push(typeobj.getAssignmentName()+' ' + value + ' = '+assignment+';');
	preamble.length && preamble.forEach(function(c){ code.push(c) });
	code.push('result = '+result + ';');

	cleanup.length && cleanup.forEach(function(c){ code.push(c) });
	declare.length && declare.forEach(function(d){ addExtern(state,d) });

	insertExceptionBlock(indent, code);

	return code.map(function(l) { return indent + l } ).join('\n');
}

/**
 * generate the setter property
 */
function generateSetterProperty(options, metabase, state, library, classname, propertyname, property, varname, cast, indent) {
	var code = [],
		classObj = typelib.resolveType(classname),
		typeobj = typelib.resolveType(platform_typelib.sanitizeTypeName(property.type)),
		preamble = [],
		cleanup = [],
		declare = [],
		result = typeobj.getRealCast(typeobj.toNativeBody('value',preamble,cleanup,declare));
	code.push('try {');
	if (!isPropertyInstance(options,metabase,state,property)) {
		varname = classObj.toClassName();
	}
	preamble.length && preamble.forEach(function(c){ code.push(c) });
	code.push(varname+'->'+propertyname+' = '+result+';');
	cleanup.length && cleanup.forEach(function(c){ code.push(c) });
	code.push('result = JSValueMakeBoolean(ctx,true);');
	insertExceptionBlock(indent, code);

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
	if (property.metatype == 'instance') {
		return true;
	}
	if (property.attributes) {
		return property.attributes.indexOf('static')<0;
	}
	return false; 
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
	if (classname) {
		var typeobj = typelib.resolveType(classname);
		if (typeobj.isWindowsAsync()) {
			code.push('');
			code.push('#include <ppltasks.h>');
			code.push('using namespace concurrency;');
		}
	}

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
function generateNewInstance(state, metabase, indent, classname, cast, varname, methodnode, skip_var_declare) {
	var typeobj = typelib.resolveType(classname),
		typeinfo = metabase.classes[classname],
		code = [],
		cleanup = [],
		method = methodnode.method;

	if (typeobj.isWindowsDelegate() && !method) {
		var callstr = typeinfo.methods.Invoke[0].args.map(function(arg){return typelib.resolveType(arg.type).toCast()+' '+arg.name;});
		var callback_args = typeinfo.methods.Invoke[0].args.map(function(arg){
			var at = typelib.resolveType(arg.type);
			addExtern(state, 'JSValueRef '+at.toJSValueName()+'(JSContextRef,'+at.toCast()+',JSValueRef*);');
			return at.toJSValueName()+'(gctx,'+arg.name+',NULL)';
		});

		if (!skip_var_declare) {
			code.push(cast+' '+varname+' = nullptr;');
		}
		code.push('try {');
		code.push('if (argumentCount == 2 && JSValueIsObject(ctx, arguments[1]) && JSObjectIsFunction(ctx, JSValueToObject(ctx,arguments[1],NULL)))');
		code.push('{');
		code.push('\tJSObjectRef callback = JSValueToObject(ctx,arguments[1],NULL);');
		code.push('\tauto gctx = HyperloopGlobalContext();');
		code.push('\tauto ggctx = JSContextGetGroup(gctx);');
		code.push('\tJSContextGroupRetain(ggctx);');
		code.push('\tJSValueProtect(gctx, arguments[1]); // we should keep this until removal method is called');

		code.push('\t'+varname+' = ref new '+typeobj.toClassName()+'([gctx,ggctx,callback]('+callstr.join(',')+') {');
		code.push('\t\tJSValueRef callback_args[] = {');
		code.push('\t\t\t'+callback_args.join(',\n'+indent+'\t\t\t'));
		code.push('\t\t};');
		code.push('\t\tJSValueRef result = JSObjectCallAsFunction(gctx, callback, callback, '+callback_args.length+', callback_args, NULL);');
		code.push('\t\t// TODO: How do we know when to unprotect the object and release the context group?');
		code.push('\t\t// JSContextGroupRelease(ggctx);');
		code.push('\t});');

		code.push('}');

	} else if (methodnode.selector) {
		code.push(cast+' '+varname+' = nullptr;');
		var selector = generateMethodArguments(state.options,metabase,state,method,typelib,false,code,cleanup,indent);
		code.push('try {');
		code.push(varname+' = ref new '+typeobj.toClassName()+'('+selector+');');

	} else {
		if (typeinfo.methods && typeinfo.methods['.ctor']) {
			code.push(cast+' '+varname+' = ref new '+typeobj.toClassName()+'();');
		} else if (!typeobj.hasConstructor()) {
			code.push('Platform::Object^ '+varname+' = nullptr;');
		} else if (typeobj.isWindowsValueType()) {
			code.push(cast+' '+varname+' = new '+typeobj.toClassName()+'();');
		} else {
			code.push(cast+' '+varname+' = nullptr;');
		}
		code.push('try {'); // assuming default constructor never throws exception
	}

	cleanup.forEach(function(c){ code.push(c); });
	insertExceptionBlock(indent, code);
	return code.map(function(l) { return indent + l } ).join('\n');
}

function generateCodeDependencies(options,state,symboltable,relativeFilename,arch,symbols,nodefail) {
	/*
	 * platform-specific dependencies
	 *
	 * - event delegate doesn't have args info in .ctor but does them in 'Invoke' methods 
	 */
	function resolveDelegateTypes(args) {
		args && args.forEach(function(arg){
			if (arg.type) {
				var t = typelib.resolveType(arg.type);
				if (t.isWindowsDelegate()) {
					var c = state.metabase.classes[t.toName()];
					if (c && c.methods && c.methods.Invoke && c.methods.Invoke[0].args) {
						c.methods.Invoke[0].args.forEach(function(ta) {
							typelib.resolveType(ta.type);
						});
					}
				}
			}
		});
	}

	function resolveGenericTypes(name) {
		var type = typelib.resolveType(name);
		if (type._windows_generic_args) {
			typelib.resolveType(type._value); // cache with sanitized name
			type._windows_generic_args.forEach(function(t) {
				typelib.resolveType(t);
			});
		}
	}

	Object.keys(symbols).forEach(function(name){
		var symbol = symbols[name];
		switch (symbol.type) {
			case 'method': {
				resolveDelegateTypes(symbol.method.args);
				resolveGenericTypes(symbol.method.returnType);
			}
		}
	});
}
