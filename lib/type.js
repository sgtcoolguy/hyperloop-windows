/**
 * Windows specific type library subclass
 */
var hyperloop = require('./dev').require('hyperloop-common'),
	typelib = hyperloop.compiler.type,
	log = hyperloop.log,
	SuperClass = typelib.Class,
	util = hyperloop.util;

const WINDOWS_STRING = 'Platform.String';

WindowsType.prototype = Object.create(SuperClass.prototype);
WindowsType.prototype.constructor = WindowsType;
WindowsType.prototype.$super = SuperClass.prototype;

function WindowsType() { 
	SuperClass.apply(this,arguments);
}

function namespaceForClass(name) {
	return name.replace(/\./g,'::');
}

WindowsType.prototype._parse = function(metabase) {
	this._type = sanitizeTypeName(this._type);
	var type = this._type;

	if (metabase.classes[type] && metabase.classes[type].attributes) {
		this._is_abstract = metabase.classes[type].attributes.indexOf('private') >= 0;
	}

	var async_match = type.match(/(\.IAsync.*)`(\d)/);
	if (async_match) {
		this._generic_sanitized_type = sanitizeTypeName(this._type.substring(0, async_match.index+async_match[1].length));
		var entry = metabase.classes[type];
		if (!entry) {
			// heuristic search for generic type name
			var argCount = async_match[2].toString();
			if (argCount=='1') {
				var type1 = this._generic_sanitized_type+'`1<T>';
				var type2 = this._generic_sanitized_type+'`1<TResult>';
				var type3 = this._generic_sanitized_type+'`1<TProgress>';
				entry = metabase.classes[type1] || metabase.classes[type2] || metabase.classes[type3];
			} else if (argCount=='2') {
				var type1 = this._generic_sanitized_type+'`2<K,V>';
				var type2 = this._generic_sanitized_type+'`2<TResult,TProgress>';
				var type3 = this._generic_sanitized_type+'`2<TSender,TResult>';
				entry = metabase.classes[type1] || metabase.classes[type2] || metabase.classes[type3];
			}
		}
		if (entry) {
			this._windows_generic_name = entry.name;
		} else {
			log.fatal('Can\'t find metabase entry for '+type);
		}

		var valueTypeCheck = [];
		this._windows_generic_args = type.match(/<(.*)>$/)[1].toString().split(',').map(function(t,i) { valueTypeCheck[i] = t.match(/^valuetype\s/); return sanitizeTypeName(t); });
		this._windows_generic_winargs = this._windows_generic_args.map(function(t,i) { return namespaceForClass(t)+(valueTypeCheck[i]?'':'^'); });
		this._windows_generic_value = this._generic_sanitized_type+'`'+this._windows_generic_args.length+'<'+this._windows_generic_args.join(',')+'>';
		this._windows_generic_jstype = this._generic_sanitized_type+'<'+this._windows_generic_args.join(',')+'>';
		this._windows_generic_ctype = util.sanitizeSymbolName(this._windows_generic_jstype);
		this._windows_generic_wintype = namespaceForClass(this._generic_sanitized_type)+'<'+this._windows_generic_winargs.join(',')+'>^';
		this._is_windows_async = true;
		this._jstype = SuperClass.JS_OBJECT;
		this._nativetype = SuperClass.NATIVE_OBJECT;

		var args = [];
		this._windows_generic_args.forEach(function(t) {
			t = typelib.resolveType(t);
			if (t.isWindowsValueType()) {
				args.push(t.toClassName());
			} else {
				args.push(t.toCast());
			}
		});
		this._name = this._generic_sanitized_type.replace(/\./g,'::')+'<'+args.join(',')+'>';
		
		return;
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

			if (this.isWindowsValueType()) {
				this._nativetype = SuperClass.NATIVE_STRUCT;
				this._value += ' *';
				this._pointer = '*';
				this._was_not_pointer_obj = true;
			}
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

WindowsType.prototype.hasWindowsHandle = function() {
	return (!this.isWindowsEnum() && !this.isWindowsValueType());
};

WindowsType.prototype.isWindowsEnum = function() {
	return this._extends && this._extends.indexOf('System.Enum') >= 0;
};

WindowsType.prototype.isWindowsValueType = function() {
	return this._extends && this._extends.indexOf('System.ValueType') >= 0;
};

WindowsType.prototype.isWindowsDelegate = function() {
	return this._extends && this._extends.indexOf('System.MulticastDelegate') >= 0;
};

WindowsType.prototype.isWindowsAsync = function() {
	return this._is_windows_async;
};

WindowsType.prototype.toClassName = function() {
	if (this._windows_generic_args) {
		return this._name;
	}
	if (this._nativetype == SuperClass.NATIVE_OBJECT || this._nativetype == SuperClass.NATIVE_STRUCT) {
		return this._name.replace(/\./g,'::');
	}
	return this.$super.toName.call(this);
};

WindowsType.prototype.toName = function() {
	if (this._windows_generic_args) {
		return this._windows_generic_value;
	}
	return this.$super.toName.call(this);
};

WindowsType.prototype.toSafeClassName = function() {
	return sanitizeTypeName(this.toName());
};

WindowsType.prototype.safeName = function(name) {
	return util.sanitizeSymbolName(name);
};

WindowsType.prototype.toCast = function(leaveCast) {
	if (this.isWindowsEnum()) {
		return this.toClassName();
	} else if (this.isWindowsValueType()) {
		return this.toClassName()+'*';
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

WindowsType.prototype.getRealCast = function(value) {
	if (this.isWindowsValueType()) {
		return 'static_cast<'+this.toClassName()+'>('+value+')';
	}
	return this.$super.getRealCast.call(this,value);
};

WindowsType.prototype.toBaseCast = function(leaveCast) {
	if (this.isWindowsEnum()) {
		return 'int';
	} else if (this.isWindowsValueType()) {
		return 'void *';
	} else if (this.isWindowsDelegate()) {
		return this.toCast(leaveCast);
	} else if (this._type == WINDOWS_STRING) {
		return this.toCast(leaveCast);
	} else if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return 'Platform::Object^';
	}
	return this.toCast(leaveCast);
};

WindowsType.prototype.toVoidCast = function(varname) {
	if (this.isWindowsValueType()) {
		return this.$super.toVoidCast.call(this,varname);
	} else if (this._nativetype === SuperClass.NATIVE_OBJECT) {
		return 'HyperloopWindowsObjectToPointer('+varname+')';
	}
	return this.$super.toVoidCast.call(this,varname);
};

WindowsType.prototype.toNativeObject = function() {
	if (this.isWindowsEnum()) {
		return 'static_cast<'+this.toCast()+'>(o->getObject())';
	} else if (this.isWindowsValueType()) {
		return 'static_cast<'+this.toCast()+'>(o->getObject())';
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

WindowsType.prototype.toNullCheck = function(varname,indent,code) {
	if (!this.isWindowsEnum()) {
		return this.$super.toNullCheck.call(this,varname,indent,code);
	}
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
