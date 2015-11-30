/**
 * Emitter
 *
 * @class Emitter
 */
function Emitter() {
	this._listeners = {};
}

/**
 * Prida posluchac na specifikovanou udalost.
 *
 * @param {string}   type
 * @param {Function} listener
 */
Emitter.prototype.addEventListener = function(type, listener) {
	if (!type || typeof type !== "string") {
		throw new Error("Invalid argument type");
	}
	if (!listener || typeof listener !== "function") {
		throw new Error("Invalid argument listener");
	}
	this._listeners[type] = this._listeners[type] || [];
	this._listeners[type].push(listener);
};

/**
 * Odebere posluchac na specifikovanou udalost.
 *
 * @param {string}   type
 * @param {Function} listener
 */
Emitter.prototype.removeEventListener = function(type, listener) {
	if (!type || typeof type !== "string") {
		throw new Error("Invalid argument type");
	}
	if (this._listeners[type]) {
		var index = this._listeners[type].indexOf(listener);
		if (index > -1) {
			this._listeners[type].splice(index, 1);
		}
	}
};

/**
 * Vytvori udalost.
 *
 * @protected
 * @param {object}   event
 */
Emitter.prototype.dispatchEvent = function(customEvent) {
	if (!customEvent || typeof customEvent !== "object" || typeof customEvent.type === "undefined") {
		throw new Error("Invalid argument event");
	}
	if (this._listeners[customEvent.type]) {
		this._listeners[customEvent.type].forEach(function(func) {
			func(customEvent);
		}, this);
	}
};