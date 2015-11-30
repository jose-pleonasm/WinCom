if (!Function.prototype.bind) {
	/**
	 * ES5 Function.prototype.bind
	 * Vrací funkci zbindovanou do zadaného kontextu.
	 * Zbylé volitelné parametry jsou předány volání vnitřní funkce.
	 * @param {object} thisObj Nový kontext
	 * @returns {function}
	 */
	Function.prototype.bind = function(thisObj) {
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments)));
		}
	}
}

if (typeof Object.create != 'function') {
	// Production steps of ECMA-262, Edition 5, 15.2.3.5
	// Reference: http://es5.github.io/#x15.2.3.5
	Object.create = (function() {
		// To save on memory, use a shared constructor
		function Temp() {}

		// make a safe reference to Object.prototype.hasOwnProperty
		var hasOwn = Object.prototype.hasOwnProperty;

		return function (O) {
			// 1. If Type(O) is not Object or Null throw a TypeError exception.
			if (typeof O != 'object') {
				throw TypeError('Object prototype may only be an Object or null');
			}

			// 2. Let obj be the result of creating a new object as if by the
			//    expression new Object() where Object is the standard built-in
			//    constructor with that name
			// 3. Set the [[Prototype]] internal property of obj to O.
			Temp.prototype = O;
			var obj = new Temp();
			Temp.prototype = null; // Let's not keep a stray reference to O...

			// 4. If the argument Properties is present and not undefined, add
			//    own properties to obj as if by calling the standard built-in
			//    function Object.defineProperties with arguments obj and
			//    Properties.
			if (arguments.length > 1) {
				// Object.defineProperties does ToObject on its first argument.
				var Properties = Object(arguments[1]);
				for (var prop in Properties) {
					if (hasOwn.call(Properties, prop)) {
						obj[prop] = Properties[prop];
					}
				}
			}

			// 5. Return obj
			return obj;
		};
	})();
}

if (!Array.prototype.forEach) { 
	Array.prototype.forEach = function(cb, _this) {
		var len = this.length;
		for (var i=0;i<len;i++) { 
			if (i in this) { cb.call(_this, this[i], i, this); }
		}
	}
}
if (!Array.forEach) { 
	Array.forEach = function(obj, cb, _this) { Array.prototype.forEach.call(obj, cb, _this); }
}

/** CustomEvent polyfill */
(function() {
	if (!window.CustomEvent && document.createEventObject) { /* IE only */
		window.CustomEvent = function(type, props) {
			if (!arguments.length) { throw new Error("Not enough arguments"); }
			var def = {
				type: type,
				bubbles: false,
				cancelable: false,
				detail: null
			}
			var event = document.createEventObject();
			for (var p in def)   { event[p] = def[p];   }
			for (var p in props) { event[p] = props[p]; }
			return event;
		}

		return;
	}

	try {
		new CustomEvent("test");
	} catch (e) { /* ctor version not supported or no window.CustomEvent */
		var CE = function (type, props) {
			if (!arguments.length) { throw new Error("Not enough arguments"); }
			var def = {
				bubbles: false,
				cancelable: false,
				detail: null 
			};
			for (var p in props)   { def[p] = props[p];   }
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent(type, def.bubbles, def.cancelable, def.detail);
			return event;
		};
		
		CE.prototype = (window.CustomEvent || window.Event).prototype;
		window.CustomEvent = CE;
	}
})();