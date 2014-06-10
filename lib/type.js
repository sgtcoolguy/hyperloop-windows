/**
 * Windows specific type library subclass
 */
var hyperloop = require('./dev').require('hyperloop-common'),
	typelib = hyperloop.compiler.type,
	SuperClass = typelib.Class,
	util = hyperloop.util;

const WINDOWS_STRING = 'Platform.String';

WindowsType.prototype = Object.create(SuperClass.prototype);
WindowsType.prototype.constructor = WindowsType;
WindowsType.prototype.$super = SuperClass.prototype;

function WindowsType() { 
	SuperClass.apply(this,arguments);
}

WindowsType.prototype._parse = function(metabase) {
	this._type = sanitizeTypeName(this._type);
	var type = this._type;

	if (metabase.classes[type] && metabase.classes[type].attributes) {
		this._is_abstract = metabase.classes[type].attributes.indexOf('private') >= 0;
	}

	switch (type) {
		case 'string': {
			this._type = WINDOWS_STRING;
			this._jstype = SuperClass.JS_OBJECT;
			this._nativetype = SuperClass.NATIVE_OBJECT;
			this._name = this._type;
			this._value = this._type;
			return;
		}
	}

	this.$super._parse.call(this,metabase);
	if (this._jstype === SuperClass.JS_UNDEFINED) {
		// check to see if a class
		var entry = metabase.classes[type];
		if (entry) {
			this._jstype = SuperClass.JS_OBJECT;
			this._nativetype = SuperClass.NATIVE_OBJECT;
			this._name = type;
			this._value = type;
			this._extends = entry.extends;
			return;
		}
	}
};

WindowsType.prototype.hasConstructor = function() {
	if (this.isWindowsEnum()) {
		return false;
	}
	return true;
};

WindowsType.prototype.toValueAtConversionFail = function() {
	if (this.isWindowsEnum()) {
		return '('+this.toCast()+')0';
	}
	return this.$super.toValueAtConversionFail.call(this);
};

WindowsType.prototype.isWindowsEnum = function() {
	return this._extends && this._extends.indexOf('System.Enum') >= 0;
};


WindowsType.prototype.toClassName = function() {
	if (this._nativetype == SuperClass.NATIVE_OBJECT) {
		return this._name.replace(/\./g,'::');
	}
	return this.$super.toName.call(this);
};

WindowsType.prototype.safeName = function(name) {
	return util.sanitizeSymbolName(name);
};

WindowsType.prototype.toCast = function(leaveCast) {
	if (this.isWindowsEnum()) {
		return this.toClassName();
	} else if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return this.toClassName()+'^';
	}
	return this.$super.toCast.call(this,leaveCast);
};

WindowsType.prototype.getNewNativeObjectCast = function(varname) {
	if (this.isWindowsEnum()) {
		return '<int>((int)'+varname+')';
	}
	return '<'+this.toCast()+'>('+varname+')';
};

WindowsType.prototype.toBaseCast = function(leaveCast) {
	if (this.isWindowsEnum()) {
		return 'int';
	} else if (this._type == WINDOWS_STRING) {
		return this.toCast(leaveCast);
	} else if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return 'Platform::Object^';
	}
	return this.toCast(leaveCast);
};

WindowsType.prototype.toVoidCast = function(varname) {
	if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return 'HyperloopWindowsObjectToPointer('+varname+')';
	}
	return this.$super.toVoidCast.call(this,varname);
};

WindowsType.prototype.toNativeObject = function() {
	if (this.isWindowsEnum()) {
		return '('+this.toCast()+')o->getObject()';
	}
	return this.$super.toNativeObject.call(this);
};

WindowsType.prototype.toNativeBody = function(varname, preamble, cleanup, declare) {
	if (this.toClassName() == 'Platform::String') {
		return 'HyperloopWindowsGetPlatformString(ctx, '+varname+')';
	}
	return this.$super.toNativeBody.call(this,varname, preamble, cleanup, declare);
};

WindowsType.prototype.isAbstractClass = function() {
	return this._is_abstract;
};

function sanitizeTypeName(name) {
	if (!name) return name;
	// special conversion
	if (name == 'string') return 'Platform.String';
	if (name == 'object') return 'Platform.Object';
	return name.replace(/^(class )|^(valuetype )/,'').replace(/(\[mscorlib\]System.)/,'Platform.').trim();
}

exports.sanitizeTypeName = sanitizeTypeName;

exports.Class = WindowsType;
