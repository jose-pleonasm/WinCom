
/**
 * @typedef {Object} MessageEvent
 * @property {string} origin
 * @property {Intermediator~PostProofPacket} data
 */

/** @namespace Intermediator */
var Intermediator = {};

/**
 * @typedef {Object} Intermediator~Packet
 * @property {string} channel
 * @property {*} body
 */

/**
 * @typedef {(Intermediator~Packet|string)} Intermediator~PostProofPacket
 */

/** @constant {boolean} Intermediator.STRING_ONLY */
Intermediator.STRING_ONLY = (function() {
	var r = false;
	try { window.postMessage({ toString:function(){ r=true; } },'*'); } catch (e) {}
	return r;
})();

/** @constant {string} Intermediator.POSTPROOF_PACKET_MARK */
Intermediator.POSTPROOF_PACKET_MARK = '/*WinCom.postproofpacket*/';

/** @type {Object} */
Intermediator._connections = {};

/**
 * @function Intermediator.makePacket
 * @param  {string} channel
 * @param  {*} msg
 * @return {Intermediator~Packet}
 */
Intermediator.makePacket = function(channel, msg) {
	return {
		channel: channel,
		body: msg
	};
};

/**
 * @function Intermediator.postalize
 * @param  {Intermediator~Packet} packet
 * @return {Intermediator~PostProofPacket}
 */
Intermediator.postalize = function(packet) {
	if (Intermediator.STRING_ONLY) {
		packet = Intermediator.POSTPROOF_PACKET_MARK + JSON.stringify(packet);
	}

	return packet;
};

/**
 * @function Intermediator.normalize
 * @param  {Intermediator~PostProofPacket} packet
 * @return {Intermediator~Packet}
 */
Intermediator.normalize = function(packet) {
	if (typeof packet === 'string'
			&& packet.indexOf(Intermediator.POSTPROOF_PACKET_MARK) === 0) {
		packet = packet.replace(Intermediator.CONVERTED_MSG_MARK, '');
		packet = JSON.parse(packet);
	}

	return packet;
};

/**
 * @function Intermediator.post
 * @param  {WinCom} communicator
 * @param  {*} msg
 */
Intermediator.post = function(communicator, msg) {
	var win = communicator.getTargetWindow();
	var targetOrigin = communicator.getTargetOrigin();
	var packet = Intermediator.makePacket(communicator.getChannel(), msg);
	var postProofPacket = Intermediator.postalize(packet);

	win.postMessage(postProofPacket, targetOrigin);
};

/**
 * @function Intermediator.register
 * @param  {WinCom} communicator
 */
Intermediator.register = function(communicator) {
	var channel = communicator.getChannel();

	if (Intermediator._connections[channel]) {
		throw new Error('Channel "' + channel + '" is already in use.');
	}

	Intermediator._connections[channel] = communicator;
};

/**
 * @function Intermediator.launch
 */
Intermediator.launch = function() {
	util.addEventListener(window, 'message', Intermediator._receiveMessage);
};

/**
 * @function Intermediator._receiveMessage
 * @param  {MessageEvent} event
 */
Intermediator._receiveMessage = function(event) {
	var origin = event.origin;
	var postProofPacket = event.data;
	var packet = Intermediator.normalize(postProofPacket);
	var channel = packet.channel;
	var msg = packet.body;
	var communicator = Intermediator._connections[channel];

	if (communicator
			&& (communicator.getTargetOrigin() === '*'
				|| communicator.getTargetOrigin() === origin)) {
		communicator.process(msg);
	}
};


Intermediator.launch();


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

	Intermediator.register(this);
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
	Intermediator.post(this, msg);
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
