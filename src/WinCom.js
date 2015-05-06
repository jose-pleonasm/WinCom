(function() {

	if (!Function.prototype.bind) {
		Function.prototype.bind = function(thisObj) {
			var fn = this;
			var args = Array.prototype.slice.call(arguments, 1);
			return function() {
				return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments)));
			};
		};
	}

	if (!Object.create) {
		Object.create = function (o) {
			if (arguments.length > 1) { throw new Error("Object.create polyfill only accepts the first parameter"); }
			var tmp = function() {};
			tmp.prototype = o;
			return new tmp();
		};
	}

	if (!Array.isArray) {
		Array.isArray = function (vArg) {
			return Object.prototype.toString.call(vArg) === "[object Array]";
		};
	}

	if (!Array.prototype.forEach) { 
		Array.prototype.forEach = function(cb, _this) {
			var len = this.length;
			for (var i=0;i<len;i++) { 
				if (i in this) { cb.call(_this, this[i], i, this); }
			}
		};
	}
	if (!Array.forEach) { 
		Array.forEach = function(obj, cb, _this) { Array.prototype.forEach.call(obj, cb, _this); };
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

	/**
	 * Realizuje dedicnost.
	 *
	 * @param  {Function} child  Konstruktor budouciho potomka.
	 * @param  {Function} parent Konstruktor budouciho rodice.
	 */
	function _inherit(child, parent) {
		var F = function() { };
		F.prototype = parent.prototype;
		child.prototype = Object.create(parent.prototype);
		child.prototype.constructor = child;
		child.$superClass = parent.prototype;
	}

	/**
	 * Pomocna fce pro naveseni posluchace.
	 *
	 * @param {Object}   elm
	 * @param {string}   type
	 * @param {Function} action
	 */
	function _addEventListener(elm, type, action) {
		if (document.addEventListener) {
			elm.addEventListener(type, action);
		} else {
			elm.attachEvent("on"+type, action);
		}
	}

	/**
	 * Implementace fronty pro volani funkci.
	 *
	 * @class Queue
	 */
	function Queue() {
		this._queue = [];
	}

	/**
	 * Prida funkci a jeji argumenty do fronty.
	 *
	 * @param {Object} context
	 * @param {string} funcName
	 * @param {*[]}    args
	 */
	Queue.prototype.add = function(context, funcName, args) {
		this._queue.push({
			context: context,
			funcName: funcName,
			args: args
		});
	};

	/**
	 * Zpracuje frontu - zavola vsechny specifikovane funkce.
	 */
	Queue.prototype.process = function() {
		var item = null;
		while (item = this._queue.shift()) {
			item.context[item.funcName].apply(item.context, item.args);
		}
	};

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

	/**
	 * @typedef {(Object|string)} OperatorMsg
	 * @property {string} id   ID zpravy
	 * @property {*}      data obsah zpravy
	 */

	/**
	 * Nastroj pro navazani spojeni a komunikovani mezi instancemi WinCom.
	 *
	 * @static
	 */
	var Operator = {};

	/** @constant {number} */
	Operator.CONNECT_INTERVAL = 500;

	/** @constant {number} */
	Operator.CONNECT_TIMEOUT = 2000;

	/**
	 * Priznak ze user agent umi posilat pouze string (IE8).
	 *
	 * @constant
	 * @type {boolean}
	 */
	Operator.STRING_ONLY = (function() {
		var r = false;
		try { window.postMessage({ toString:function(){ r=true; } },"*"); } catch (e) {}
		return r;
	})();

	/**
	 * Priznak ze je zprava zkonvertovana "rucne".
	 *
	 * @constant
	 * @type {string}
	 */
	Operator.CONVERTED_MSG_MARK = "/*Operator:converted*/";

	/**
	 * Uloziste pro vsechna registrovana spojeni.
	 *
	 * @type {Object}
	 */
	Operator._connections = {};

	//TODO: prejmenovat na launch
	/**
	 * Aktivuje operatora.
	 */
	Operator.turnOn = function() {
		_addEventListener(window, "message", Operator._receiveMessage);
	};

	/**
	 * Vytvori/navaze spojeni mezi dvema instancemi WinCom dle specifikovaneho ID.
	 *
	 * @param  {string}   id
	 * @param  {Object}   win
	 * @param  {string}   origin
	 * @param  {Object}   callbacks
	 * @param  {Function} callbacks.ready
	 * @param  {Function} callbacks.receive
	 * @param  {Function} callbacks.error
	 * @param  {Object}   [settings]
	 * @param  {number}   [settings.interval]
	 * @param  {number}   [settings.timeout]
	 */
	Operator.register = function(id, win, origin, callbacks, settings) {
		settings = settings || {};
		if (Operator._connections[id]) {
			throw new Error("Connection with id " + id + " already exists.");
		}
		Operator._connections[id] = {
			origin: origin,
			win: win,
			funcReady: callbacks.ready,
			funcReceive: callbacks.receive,
			funcError: callbacks.error,
			interval: settings.interval || Operator.CONNECT_INTERVAL,
			timeout: settings.timeout || Operator.CONNECT_TIMEOUT,
			ready: false,
			connectIntervalId: null,
			connectTimeoutId: null
		};
		Operator._connect(id);
		Operator._connections[id].connectTimeoutId = setInterval(Operator._timeout.bind(Operator, id), Operator._connections[id].timeout);
	};

	/**
	 * Informuje zda je spojeni specifikovane IDckem ready.
	 *
	 * @param  {string}  id
	 * @return {boolean}
	 */
	Operator.isReady = function(id) {
		return Operator._connections[id].ready;
	};

	/**
	 * Odesle zpravu.
	 *
	 * @param  {string}   id
	 * @param  {*}        data
	 * @param  {string}   origin
	 */
	Operator.post = function(id, data, origin) {
		Operator._connections[id].win.postMessage(Operator._createOperatorMsg(id, data), origin);
	};

	/**
	 * Osetri timeout.
	 *
	 * @param  {string}   id
	 */
	Operator._timeout = function(id) {
		Operator._clearHandshakeMess(id);
		Operator._connections[id].funcError({ type:"error" }, { reason:"timeout", delay:Operator._connections[id].timeout, msg:"Connection failed! Nobody answered." });
	};

	/**
	 * Navazani spojeni.
	 *
	 * @param  {string} id
	 */
	Operator._connect = function(id) {
		Operator._handshake(id);
		if (!Operator._connections[id].ready) {
			Operator._connections[id].connectIntervalId = setTimeout(Operator._connect.bind(Operator, id), Operator._connections[id].interval);
		}
	};

	/**
	 * Podani ruky.
	 *
	 * @param  {string} id
	 */
	Operator._handshake = function(id) {
		Operator.post(id, "handA", Operator._connections[id].origin);
	};

	/**
	 * Zpracuje prichozi zpravu.
	 *
	 * @param  {Object} event
	 */
	Operator._receiveMessage = function(event) {
		var operatorMsg = Operator._parseOperatorMsg(event.data);
		if (!operatorMsg) {
			return;
		}
		var id = operatorMsg.id;
		var data = operatorMsg.data;

		if (!Operator._connections[id] ||
		    (Operator._connections[id].origin !== "*" && Operator._connections[id].origin !== event.origin)) {
			return;
		}

		if (data === "handA") {
			// potrasani rukou
			Operator.post(id, "handB", event.origin);

		} else if (data === "handB") {
			Operator._clearHandshakeMess(id);
			Operator._setReady(id);

		} else {
			if (!Operator._connections[id].ready) {
				Operator._clearHandshakeMess(id);
				Operator._setReady(id);
			}
			Operator._connections[id].funcReceive(event, data);
		}
	};

	/**
	 * Prohlasi spojeni za pripravene.
	 *
	 * @param  {string} id
	 */
	Operator._setReady = function(id) {
		Operator._connections[id].ready = true;
		Operator._connections[id].funcReady({ type:"ready" });
	};

	/**
	 * Uklidi bordel po handshaku.
	 *
	 * @param  {string} id
	 */
	Operator._clearHandshakeMess = function(id) {
		if (Operator._connections[id].connectIntervalId) {
			clearTimeout(Operator._connections[id].connectIntervalId);
			Operator._connections[id].connectIntervalId = null;
		}
		if (Operator._connections[id].connectTimeoutId) {
			clearTimeout(Operator._connections[id].connectTimeoutId);
			Operator._connections[id].connectTimeoutId = null;
		}
	};

	/**
	 * Vytvori zpravu pro poslani.
	 *
	 * @param  {string} id
	 * @param  {*}      data
	 * @return {OperatorMsg}
	 */
	Operator._createOperatorMsg = function(id, data) {
		var operatorMsg = { id:id, data:data };
		if (Operator.STRING_ONLY) {
			operatorMsg = Operator.CONVERTED_MSG_MARK + JSON.stringify(operatorMsg);
		}
		return operatorMsg;
	};

	/**
	 * Rozparsuje prijatou zpravu.
	 *
	 * @param  {OperatorMsg} msg
	 * @return {Object}      obsahuje id a data
	 */
	Operator._parseOperatorMsg = function(msg) {
		if (!msg) {
			return null;
		}
		if (typeof msg === "string" && msg.indexOf(Operator.CONVERTED_MSG_MARK) === 0) {
			msg = msg.replace(Operator.CONVERTED_MSG_MARK, "");
			msg = JSON.parse(msg);
		}
		return { id:msg.id, data:msg.data };
	};

	/**
	 * WINdows COMmunicator
	 * Spojeni napric ruznymi instancemi window (cross frame).
	 *
	 * @class WinCom
	 * @extends Emitter
	 * @param {string} connectionId ID spojeni.
	 * @param {Object} options  Volby spojeni.
	 * @param {string}          [options.targetOrigin]
	 * @param {string}          [options.iframeId]
	 * @param {(string|number)} [options.windowName]
	 * @param {Object}          [options.windowInstance]
	 */
	function WinCom(connectionId, options) {
		options = options || {};
		if (!connectionId) {
			throw new Error("Argument connectionId must be specified.");
		}
		this._connectionId = connectionId;
		this._targetOrigin = options.targetOrigin || "*";
		this._targetWindow = null;
		this._queue = new Queue();
		if (options.iframeId) {
			var iframe = window.document.getElementById(options.iframeId);
			if (!iframe) {
				throw new Error("Iframe with id " + options.iframeId + " doesn't exists.");
			}
			this._targetWindow = iframe.contentWindow;

		} else if (options.windowName) {
			var win = window.frames[options.windowName];
			if (!win) {
				throw new Error("Window instance with name " + options.windowName + " doesn't exists.");
			}
			this._targetWindow = win;

		} else if (options.windowInstance) {
			if (!options.windowInstance instanceof Window) {
				throw new Error("Invalid window instance.");
			}
			this._targetWindow = options.windowInstance;

		} else {
			throw new Error("Window instance must be specified.");
		}

		WinCom.$superClass.constructor.call(this);
		Operator.register(
			this._connectionId,
			this._targetWindow,
			this._targetOrigin,
			{
				ready: this._ready.bind(this),
				receive: this._receive.bind(this),
				error: this._error.bind(this)
			}
		);
	}

	_inherit(WinCom, Emitter);

	/**
	 * Posle zpravu.
	 *
	 * @param  {*} msg
	 */
	WinCom.prototype.post = function(msg) {
		if (!Operator.isReady(this._connectionId)) {
			this._queue.add(this, "post", Array.prototype.slice.call(arguments));
			return;
		}
		Operator.post(this._connectionId, msg, this._targetOrigin);
	};

	/**
	 * Zpracuje udalost z Operatoru o navazani spojeni.
	 *
	 * @param  {Object} event Originalni object udalosti.
	 * @param  {*}      data  Vlastni data, ktera odeslala druha strana.
	 */
	WinCom.prototype._ready = function(event, data) {
		this._queue.process();
	};

	/**
	 * Zpracuje zpravu z Operatoru a distribuuje ji dale.
	 *
	 * @param  {Object} event Originalni object udalosti.
	 * @param  {*}      data  Vlastni data, ktera odeslala druha strana.
	 */
	WinCom.prototype._receive = function(event, data) {
		this.dispatchEvent(new CustomEvent("message", {detail: data}));
	};

	/**
	 * Zpracuje chybu z Operatoru.
	 *
	 * @param  {Object} event Originalni object udalosti.
	 * @param  {*}      data  Vlastni data, ktera odeslala druha strana.
	 */
	WinCom.prototype._error = function(event, data) {
		this.dispatchEvent(new CustomEvent("error", {detail: data}));
	};



	Operator.turnOn();
	window.WinCom = WinCom;

})();