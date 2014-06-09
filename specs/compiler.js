/**
 * compiler test case for Windows
 */
var should = require('should'),
    path = require('path'),
    fs = require('fs'),
    wrench = require('wrench'),
    compiler = require('../lib/compiler'),
    TMP = path.join('.', '_tmp'),
    winMetabase;

describe("Windows compiler", function() {

	before(function(){
		wrench.mkdirSyncRecursive(TMP, 0755);
		winMetabase = JSON.parse(fs.readFileSync(path.join(__dirname, 'metabase.json'), 'utf8'));
	});

	after(function(){
		wrench.rmdirSyncRecursive(TMP);
	});

	it("should load",function(done) {
		should.exist(compiler);
		done();
	});

	it("should look up method",function(done) {
		should.exist(winMetabase);
		winMetabase.should.be.an.Object;
		winMetabase.classes.should.be.an.Object;
		should.exist(winMetabase.classes['Platform.Object']);
		state = { metabase: winMetabase };
		node = { args: [], start: 1 };

		GetType = compiler.getInstanceMethodSymbol(state, 'Platform.Object', 'GetType', 'varname', 'symbolname', node, function(node,msg){
			throw new Error(msg);
		});
		should.exist(GetType);
		GetType.should.be.an.Object;
		GetType.type.should.be.eql('method');

		GetType.returnType.should.be.eql('class Platform.Type');

		should.exist(GetType.method);
		should.exist(GetType.method.attributes);
		(GetType.method.attributes.indexOf('public') >= 0).should.be.true;
		(GetType.method.attributes.indexOf('instance') >= 0).should.be.true;
		done();
	});

	it("should look up static method",function(done) {
		should.exist(winMetabase);
		winMetabase.should.be.an.Object;
		winMetabase.classes.should.be.an.Object;
		should.exist(winMetabase.classes['Platform.Type']);
		state = { metabase: winMetabase };
		node = { args: ['a'], start: 1 };

		GetType = compiler.getStaticMethodSymbol(state, 'Platform.Type', 'GetTypeCode', 'symbolname', node, function(node,msg){
			throw new Error(msg);
		});
		should.exist(GetType);
		GetType.should.be.an.Object;
		GetType.type.should.be.eql('method');

		GetType.returnType.should.be.eql('valuetype Platform.TypeCode');

		should.exist(GetType.method);
		should.exist(GetType.method.attributes);
		(GetType.method.attributes.indexOf('public') >= 0).should.be.true;
		(GetType.method.attributes.indexOf('instance') >= 0).should.be.false;
		(GetType.method.attributes.indexOf('static') >= 0).should.be.true;
		done();
	});

	it("should look up property getter",function(done) {
		should.exist(winMetabase);
		winMetabase.should.be.an.Object;
		winMetabase.classes.should.be.an.Object;
		should.exist(winMetabase.classes['Platform.Type']);
		state = { metabase: winMetabase };
		node = { args: [], start: 1 };

		GetType = compiler.getGetterSymbol(state, 'Platform.Type', 'FullName', 'varname', 'symbolname', node, function(node,msg){
			throw new Error(msg);
		});
		should.exist(GetType);
		GetType.should.be.an.Object;
		GetType.class.should.be.eql('Platform.Type');
		GetType.name.should.be.eql('FullName');
		GetType.metatype.should.be.eql('getter');
		GetType.returnType.should.be.eql('string');

		done();
	});

	it("should look up property setter",function(done) {
		should.exist(winMetabase);
		winMetabase.should.be.an.Object;
		winMetabase.classes.should.be.an.Object;
		should.exist(winMetabase.classes['Platform.Type']);
		state = { metabase: winMetabase };
		node = { args: [], start: 1 };

		GetType = compiler.getSetterSymbol(state, 'Platform.Type', 'FullName', 'varname', 'symbolname', node, function(node,msg){
			throw new Error(msg);
		});
		should.exist(GetType);
		GetType.should.be.an.Object;
		GetType.class.should.be.eql('Platform.Type');
		GetType.name.should.be.eql('FullName');
		GetType.metatype.should.be.eql('setter');

		done();
	});

	it("should look up type hierarchy for methods",function(done) {
		should.exist(winMetabase);
		winMetabase.should.be.an.Object;
		winMetabase.classes.should.be.an.Object;
		should.exist(winMetabase.classes['Platform.String']);
		should.exist(winMetabase.classes['Platform.Object']);
		state = { metabase: winMetabase };
		node = { args: [], start: 1 };

		GetType = compiler.getInstanceMethodSymbol(state, 'Platform.String', 'GetType', 'varname', 'symbolname', node, function(node,msg){
			throw new Error(msg);
		});
		should.exist(GetType);
		GetType.should.be.an.Object;
		GetType.type.should.be.eql('method');

		GetType.returnType.should.be.eql('class Platform.Type');

		should.exist(GetType.method);
		should.exist(GetType.method.attributes);
		(GetType.method.attributes.indexOf('public') >= 0).should.be.true;
		(GetType.method.attributes.indexOf('instance') >= 0).should.be.true;
		done();
	});
});