/**
 * Windows specific type library subclass
 */
var hyperloop = require('./dev').require('hyperloop-common'),
	typelib = hyperloop.compiler.type,
	SuperClass = typelib.Class,
	util = hyperloop.util;

WindowsType.prototype = Object.create(SuperClass.prototype);
WindowsType.prototype.constructor = WindowsType;
WindowsType.prototype.$super = SuperClass.prototype;

function WindowsType() { 
	SuperClass.apply(this,arguments);
}

WindowsType.prototype._parse = function(metabase) {
	var type = this._type;
	switch (type) {
		case 'string': {
			this._type = 'Platform.String';
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
			return;
		}
	}
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
	if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return this.toClassName()+'^';
	}
	return this.$super.toCast.call(this,leaveCast);
};

WindowsType.prototype.toVoidCast = function(varname) {
	if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return 'HyperloopWindowsObjectToPointer('+varname+')';
	}
	return this.$super.toVoidCast.call(this,varname);
};

exports.sanitizeTypeName = function(name) {
	return name.replace(/^(class )/,'');
};

exports.Class = WindowsType;
