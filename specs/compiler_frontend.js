/**
 * compiler front-end test case
 */
var should = require('should'),
	path = require('path'),
	fs = require('fs'),
    wrench = require('wrench'),
	appc = require('node-appc'),
	_ = require('underscore'),
	hyperloop = require('hyperloop-common'),
	compiler = hyperloop.compiler.ast,
	typelib = hyperloop.compiler.type,
	windows_compiler = require('../lib/compiler'),
    TMP = path.join('.', '_tmp'),
	winMetabase = null;

describe("Windows Compiler front-end", function() {

	before(function(done) {

		wrench.mkdirSyncRecursive(TMP, 0755);

		winMetabase = JSON.parse(fs.readFileSync(path.join(__dirname, 'metabase.json'), 'utf8'));

		typelib.metabase = winMetabase;
		typelib.platform = require('../').dirname;
		done();
	});

	afterEach(function(){
		typelib.reset();
	});

	after(function(){
		wrench.rmdirSyncRecursive(TMP);
	});

	it("should load", function(done) {
		should.exist(compiler);
		done();
	});

	it("should create builtin object", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = new Date();';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		done();
	});

	it("should use type of variable within context", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = new Platform.String(\'hello\');\nvar str = s.ToString();';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_String_constructor');
		constructor.class.should.be.eql('Platform.String');

		method = _.find(state.symbols, function(value, key) {
			return value.location.line == 3;
		});
		should.exist(method);
		method.type.should.be.eql('method');
		method.metatype.should.be.eql('instance');
		method.symbolname.should.be.eql('Platform_String_ToString');
		method.class.should.be.eql('Platform.String');
		method.name.should.be.eql('ToString');
		method.instance.should.be.eql('s');
		method.returnType.should.be.eql('string');
		done();
	});

	it("should allow redefinition of variable name", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = new Platform.String(\'hello\');\nvar str = s.ToString();\ns=new Platform.Object();';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_String_constructor');
		constructor.class.should.be.eql('Platform.String');

		method = _.find(state.symbols, function(value, key) {
			return value.location.line == 3;
		});
		should.exist(method);
		method.type.should.be.eql('method');
		method.metatype.should.be.eql('instance');
		method.symbolname.should.be.eql('Platform_String_ToString');
		method.class.should.be.eql('Platform.String');
		method.name.should.be.eql('ToString');
		method.instance.should.be.eql('s');
		method.returnType.should.be.eql('string');

		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 4;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_Object_constructor');
		constructor.class.should.be.eql('Platform.Object');

		done();
	});

	it("should allow redefinition of variable name multiple times", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = new Platform.String(\'hello\');\nvar str = s.ToString();\ns=new Platform.Object();\ns=new Platform.ValueType();';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_String_constructor');
		constructor.class.should.be.eql('Platform.String');

		method = _.find(state.symbols, function(value, key) {
			return value.location.line == 3;
		});
		should.exist(method);
		method.type.should.be.eql('method');
		method.metatype.should.be.eql('instance');
		method.symbolname.should.be.eql('Platform_String_ToString');
		method.class.should.be.eql('Platform.String');
		method.name.should.be.eql('ToString');
		method.instance.should.be.eql('s');
		method.returnType.should.be.eql('string');

		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 4;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_Object_constructor');
		constructor.class.should.be.eql('Platform.Object');

		constructor = _.find(state.symbols, function(value, key) {
			return value.location.line == 5;
		});
		should.exist(constructor);
		constructor.type.should.be.eql('constructor');
		constructor.symbolname.should.be.eql('Platform_ValueType_constructor');
		constructor.class.should.be.eql('Platform.ValueType');

		done();
	});

	it("should record type of static property", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = Platform.TypeCode.Object;';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		property = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(property);
		property.type.should.be.eql('statement');
		property.symbolname.should.be.eql('Platform_TypeCode_Get_Object');
		property.class.should.be.eql('Platform.TypeCode');
		property.returnType.should.be.eql('Platform.TypeCode');
		should.exist(property.property);
		should.exist(property.property.attributes);

		done();
	});

	it("should transform class methods", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = Platform.Type.GetTypeCode(\'a\');';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		property = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(property);
		property.type.should.be.eql('method');
		property.symbolname.should.be.eql('Platform_Type_GetTypeCode');
		property.class.should.be.eql('Platform.Type');
		property.returnType.should.be.eql('valuetype Platform.TypeCode');
		should.exist(property.method);
		should.exist(property.method.attributes);

		done();
	});

	it("should transform class property", function(done) {
		var arch = 'x86',
			build_opts = {DEBUG:true,OBFUSCATE:false},
			state = {};
		source = '"use hyperloop"\nvar s = Windows.UI.Xaml.TextAlignment.Center;';

		should.exist(winMetabase);

		state.metabase = winMetabase;
		state.libfile = 'blah';
		state.symbols = {};
		state.obfuscate = false;
		compiler.compile({platform:arch}, state, windows_compiler, arch, source, 'filename', 'filename.js', build_opts);

		should.exist(state.symbols);
		state.symbols.should.be.an.Object;
		property = _.find(state.symbols, function(value, key) {
			return value.location.line == 2;
		});
		should.exist(property);
		property.type.should.be.eql('statement');
		property.metatype.should.be.eql('getter');
		property.symbolname.should.be.eql('Windows_UI_Xaml_TextAlignment_Get_Center');
		property.class.should.be.eql('Windows.UI.Xaml.TextAlignment');
		property.returnType.should.be.eql('Windows.UI.Xaml.TextAlignment');
		should.exist(property.property);
		should.exist(property.property.attributes);

		done();
	});

}); 
