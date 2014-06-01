/**
 * Windows specific type library subclass
 */
var SuperClass = require('./dev').require('hyperloop-common').compiler.type.Class;

WindowsType.prototype = Object.create(SuperClass.prototype);
WindowsType.prototype.constructor = WindowsType;
WindowsType.prototype.$super = SuperClass.prototype;

function WindowsType() { 
	SuperClass.apply(this,arguments);
}

WindowsType.prototype._parse = function(metabase) {
	this.$super._parse.call(this,metabase);
};

WindowsType.prototype.toCast = function(leaveCast) {
	return this._type.replace(/\./g, '::')+'^';
};

WindowsType.prototype.safeName = function(name) {
	return util.sanitizeSymbolName(name);
};

WindowsType.prototype.toVoidCast = function(varname) {
	return 'HyperloopWindowsObjectToPointer('+varname+')';
};

exports.Class = WindowsType;
