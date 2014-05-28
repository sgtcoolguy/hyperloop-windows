/**
 * Windows specific type library subclass
 */
var SuperClass = require('./dev').require('hyperloop-common').compiler.type.Class;

WindowsType.prototype = Object.create(SuperClass.prototype);
WindowsType.prototype.constructor = WindowsType;
WindowsType.prototype.$super = SuperClass.prototype;

function WindowsType() { 
	SuperClass.apply(this,arguments);
};

WindowsType.prototype._parse = function(metabase) {
	/*
	var type = this._type;
	switch (type) {
		case 'id': {
			this._jstype = SuperClass.JS_OBJECT;
			this._nativetype = SuperClass.NATIVE_OBJECT;
			return;
		}
	}
	*/
	this.$super._parse.call(this,metabase);
}

exports.Class = WindowsType;
