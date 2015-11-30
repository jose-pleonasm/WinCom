
/** @namespace Operator */
var Operator = {};

/**
 * @typedef {Object} Operator~Packet
 * @property {string} channel
 * @property {*} msg
 */

/**
 * @typedef {(Operator~Packet|string)} Operator~PostProofPacket
 */

/**
 * @typedef {Object} Operator~MessageEvent
 * @property {string} origin
 * @property {Operator~PostProofPacket} data
 */

/** @constant {boolean} Operator.STRING_ONLY */
Operator.STRING_ONLY = (function() {
	var r = false;
	try { window.postMessage({ toString:function(){ r=true; } },'*'); } catch (e) {}
	return r;
})();

/** @constant {string} Operator.POSTPROOF_PACKET_MARK */
Operator.POSTPROOF_PACKET_MARK = '/*WinCom.postproofpacket*/';

/** @type {Object} */
Operator._connections = {};

/**
 * @function Operator.makePacket
 * @param  {string} channel
 * @param  {*} msg
 * @return {Operator~Packet}
 */
Operator.makePacket = function(channel, msg) {
	return {
		channel: channel,
		msg: msg
	};
};

/**
 * @function Operator.makePostProofPacket
 * @param  {Operator~Packet} packet
 * @return {Operator~PostProofPacket}
 */
Operator.makePostProofPacket = function(packet) {
	if (Operator.STRING_ONLY) {
		packet = Operator.POSTPROOF_PACKET_MARK + JSON.stringify(packet);
	}

	return packet;
};

/**
 * @function Operator.normalizePacket
 * @param  {Operator~PostProofPacket} packet
 * @return {Operator~Packet}
 */
Operator.normalizePacket = function(packet) {
	if (typeof packet === 'string'
			&& packet.indexOf(Operator.POSTPROOF_PACKET_MARK) === 0) {
		packet = packet.replace(Operator.CONVERTED_MSG_MARK, '');
		packet = JSON.parse(packet);
	}

	return packet;
};

/**
 * @function Operator.post
 * @param  {WinCom} communicator
 * @param  {*} msg
 */
Operator.post = function(communicator, msg) {
	var win = communicator.getTargetWindow();
	var targetOrigin = communicator.getTargetOrigin();
	var packet = Operator.makePacket(communicator.getChannel(), msg);
	var postProofPacket = Operator.makePostProofPacket(packet);

	win.postMessage(postProofPacket, targetOrigin);
};

/**
 * @function Operator.register
 * @param  {WinCom} communicator
 */
Operator.register = function(communicator) {
	var channel = communicator.getChannel();

	Operator._connections[channel] = Operator._connections[channel] || [];
	Operator._connections[channel].push(communicator);
};

/**
 * @function Operator.receiveMessage
 * @param  {Operator~MessageEvent} event
 */
Operator.receiveMessage = function(event) {
	var origin = event.origin;
	var postProofPacket = event.data;
	var packet = Operator.normalizePacket(postProofPacket);
	var channel = packet.channel;
	var msg = packet.msg;

	Operator._connections[channel].forEach(function(communicator) {
		if (communicator.getTargetOrigin() === '*'
				|| communicator.getTargetOrigin() === origin) {
			communicator.process(msg);
		}
	});
};

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

	Operator.register(this);
}
util.inherits(WinCom, Emitter);

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
 * @function WinCom#post
 * @param  {*} msg
 */
WinCom.prototype.post = function(msg) {
	Operator.post(this, msg);
};

/**
 * @function WinCom#process
 * @param  {*} msg
 * @fires WinCom#message
 */
WinCom.prototype.process = function(msg) {
	var event = new CustomEvent('message', {detail: msg});

	this.dispatchEvent(event);
};


(function() {
	util.addEventListener(window, 'message', Operator.receiveMessage);
})();
