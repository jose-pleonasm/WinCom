
var util = {};

util.inherits = function(ctor, superCtor) {
	if (ctor === undefined || ctor === null) {
		throw new TypeError('The constructor to `inherits` must not be ' +
		                    'null or undefined.');
	}

	if (superCtor === undefined || superCtor === null) {
		throw new TypeError('The super constructor to `inherits` must not ' +
		                    'be null or undefined.');
	}

	if (superCtor.prototype === undefined) {
		throw new TypeError('The super constructor to `inherits` must ' +
		                    'have a prototype.');
	}

	ctor.super_ = superCtor;
	if (Object.create) {
		ctor.prototype = Object.create(superCtor.prototype);
	} else if (Object.setPrototypeOf) {
		Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
	} else {
		throw new Error('Agent does not support inheritance this way.')
	}
};

util.addEventListener = function(elm, type, action) {
	if (elm.addEventListener) {
		elm.addEventListener(type, action);
	} else {
		elm.attachEvent("on"+type, action);
	}
};
