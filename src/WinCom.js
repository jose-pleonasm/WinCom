
/**
 * @typedef {Object} MessageEvent
 * @property {string} origin
 * @property {WinCom~PostPacket} data
 */

/** @namespace PacketUtil */
var PacketUtil = {};

/** @constant {boolean} PacketUtil.STRING_ONLY_POST */
PacketUtil.STRING_ONLY_POST = (function() {
	var r = false;
	try { window.postMessage({ toString:function(){ r=true; } },'*'); } catch (e) {}
	return r;
})();

/** @constant {string} PacketUtil.POSTPROOF_PACKET_MARK */
PacketUtil.POSTPROOF_PACKET_MARK = '/*WinCom.postproofpacket*/';

/**
 * @function PacketUtil.postalize
 * @param  {WinCom~Packet} packet
 * @return {WinCom~PostPacket}
 */
PacketUtil.postalize = function(packet) {
	if (PacketUtil.STRING_ONLY_POST) {
		packet = PacketUtil.POSTPROOF_PACKET_MARK + JSON.stringify(packet);
	}

	return packet;
};

/**
 * @function PacketUtil.normalize
 * @param  {WinCom~PostPacket} packet
 * @return {WinCom~Packet}
 */
PacketUtil.normalize = function(packet) {
	if (typeof packet === 'string'
			&& packet.indexOf(PacketUtil.POSTPROOF_PACKET_MARK) === 0) {
		packet = packet.replace(PacketUtil.CONVERTED_MSG_MARK, '');
		packet = JSON.parse(packet);
	}

	return packet;
};

/**
 * @constructor Router
 */
function Router() {
	this._routes = {};

	util.addEventListener(window, 'message', this._receiveMessage.bind(this));
}

/**
 * @function Router#register
 * @param  {string} origin
 * @param  {string} channel
 * @param  {function} callback
 */
Router.prototype.register = function(origin, channel, callback) {
	this._routes[channel] = this._routes[channel] || [];
	this._routes[channel].push({origin: origin, callback: callback});
};

/**
 * @function Router#_receiveMessage
 * @param  {MessageEvent} event
 */
Router.prototype._receiveMessage = function(event) {
	var origin = event.origin;
	var dirtyPacket = event.data;
	var packet = PacketUtil.normalize(dirtyPacket);
	var channel = packet.channel;
	var msg = packet.body;

	this._routes[channel].forEach(function(handler) {
		if (handler.origin === '*'
				|| handler.origin === origin) {
			handler.callback(msg);
		}
	});
};

/** @type {Router} */
var router = new Router();


/**
 * @constructor WinCom
 * @extends Emitter
 * @param {Object} options
 */
function WinCom(options) {
	Emitter.call(this);

	this._targetWindow = options.targetWindow;
	this._targetOrigin = options.targetOrigin || '*';
	this._channel = options.channel || WinCom.DEFAULT_CHANNEL;

	router.register(this._targetOrigin, this._channel,
			this._handle.bind(this));
}
util.inherits(WinCom, Emitter);

/**
 * @typedef {Object} WinCom~Packet
 * @property {string} channel
 * @property {*} body
 */

/**
 * @typedef {(WinCom~Packet|string)} WinCom~PostPacket
 */

/**
 * @event WinCom#message
 * @type {Object}
 * @property {*} detail
 */

/** @constant {string} WinCom.DEFAULT_CHANNEL */
WinCom.DEFAULT_CHANNEL = '__default__';

/**
 * @function WinCom#getTargetWindow
 * @return {Object}
 */
WinCom.prototype.getTargetWindow = function() {
	return this._targetWindow;
};

/**
 * @function WinCom#getTargetOrigin
 * @return {string}
 */
WinCom.prototype.getTargetOrigin = function() {
	return this._targetOrigin;
};

/**
 * @function WinCom#getChannel
 * @return {string}
 */
WinCom.prototype.getChannel = function() {
	return this._channel;
};

/**
 * @function WinCom#makePacket
 * @param  {string} channel
 * @param  {*} msg
 * @return {WinCom~Packet}
 */
WinCom.prototype.makePacket = function(channel, msg) {
	return {
		channel: channel,
		body: msg
	};
};

/**
 * @function WinCom#post
 * @param  {*} msg
 */
WinCom.prototype.post = function(msg) {
	var packet = this._makePacket(this._channel, msg);
	var postPacket = PacketUtil.postalize(packet);

	this._targetWindow.postMessage(postPacket, this._targetOrigin);
};

/**
 * @function WinCom#_handle
 * @param  {*} msg
 * @emits WinCom#message
 */
WinCom.prototype._handle = function(msg) {
	var event = new CustomEvent('message', {detail: msg});

	this.dispatchEvent(event);
};
