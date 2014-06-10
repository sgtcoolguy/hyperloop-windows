var should = require('should'),
	path = require('path'),
	typelib = require('../lib/dev').require('hyperloop-common').compiler.type,
	library = require('../lib/dev').require('hyperloop-common').compiler.library;

describe('Windows types', function(){

	before(function(){
		typelib.reset();
		typelib.metabase = null;
		typelib.platform = null;
	});

	afterEach(function(){
		typelib.reset();
		typelib.metabase = null;
		typelib.platform = null;
	});

	beforeEach(function(){
		typelib.platform = path.join(__dirname,'..');
	});

	it('Platform.Object',function() {
		typelib.metabase = {
			classes: {
				'Platform.Object': {}
			}			
		};
		var type = typelib.resolveType('Platform.Object');
		type.isJSObject().should.be.true;
		type.isNativeObject().should.be.true;
	});

	it('bool',function() {
		typelib.metabase = {
			classes: {}
		};
		var type = typelib.resolveType('bool');
		type.isJSObject().should.be.false;
		type.isNativeObject().should.be.false;
		type.isJSBoolean().should.be.true;
		type.isNativeBoolean().should.be.true;
	});

	it('Enum',function() {
		typelib.metabase = {
			classes: {
				'Platform.Object': {},
				'Windows.UI.Xaml.TextAlignment': {
			         extends: '[mscorlib]System.Enum'
				}
			}			
		};
		var type = typelib.resolveType('Windows.UI.Xaml.TextAlignment');
		type.isWindowsEnum().should.be.true;
	});

	['short', 'int', 'float', 'double', 'long'].forEach(function(name){
		it('primitive '+name,function() {
			typelib.metabase = {
				classes: {}
			};
			var type = typelib.resolveType(name);
			type.isJSObject().should.be.false;
			type.isNativeObject().should.be.false;
			type.isJSNumber().should.be.true;
			type.isNativePrimitive().should.be.true;
		});
	});

	it('toNativeName',function() {
		typelib.metabase = {
			classes: {
				'Platform.Object': {}
			}			
		};
		var type = typelib.resolveType('Platform.Object');
		type.toNativeName().should.be.equal('JSValueTo_Platform_Object');
	});

	it('toCast',function() {
		typelib.metabase = {
			classes: {
				'Platform.Object': {}
			}			
		};
		var type = typelib.resolveType('Platform.Object');
		type.toCast().should.be.equal('Platform::Object^');
		type = typelib.resolveType('int');
		type.toCast().should.be.equal('int');
	});

	it('toCast Enum',function() {
		typelib.metabase = {
			classes: {
				'Windows.UI.Xaml.TextAlignment': {
			         extends: '[mscorlib]System.Enum'
				}
			}			
		};
		var type = typelib.resolveType('Windows.UI.Xaml.TextAlignment');
		type.toCast().should.be.equal('Windows::UI::Xaml::TextAlignment');
	});
});

