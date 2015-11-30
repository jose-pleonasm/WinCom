
var Operator = {};

Operator.STRING_ONLY = (function() {
	var r = false;
	try { window.postMessage({ toString:function(){ r=true; } },'*'); } catch (e) {}
	return r;
})();

Operator.POSTPROOF_PACKET_MARK = "/*Operator:converted*/";

Operator._connections = {};

Operator.makePacket = function(channel, msg) {
	return {
		channel: channel,
		msg: msg
	};
};

Operator.makePostProofPacket = function(packet) {
	if (Operator.STRING_ONLY) {
		packet = Operator.POSTPROOF_PACKET_MARK + JSON.stringify(packet);
	}

	return packet;
};

Operator.normalizePacket = function(packet) {
	if (typeof packet === 'string'
			&& packet.indexOf(Operator.POSTPROOF_PACKET_MARK) === 0) {
		packet = packet.replace(Operator.CONVERTED_MSG_MARK, '');
		packet = JSON.parse(packet);
	}

	return packet;
};

Operator.post = function(communicator, msg) {
	var win = communicator.getWindow();
	var origin = communicator.getOrigin();
	var packet = Operator.makePacket(communicator.getChannel(), msg);
	var postProofPacket = Operator.makePostProofPacket(packet);

	win.postMessage(postProofPacket, origin);
};

Operator.register = function(communicator) {
	var channel = communicator.getChannel();

	Operator._connections[channel] = Operator._connections[channel] || [];
	Operator._connections[channel].push(communicator);
};

Operator.receiveMessage = function(event) {
	var postProofPacket = event.data;
	var packet = Operator.normalizePacket(postProofPacket);
	var channel = packet.channel;
	var msg = packet.msg;

	Operator._connections[channel].forEach(function(communicator) {
		communicator.process(msg);
	});
};

function WinCom(options) {
	Emitter.call(this);

	this._targetWindow = options.targetWindow;
	this._channel = options.channel || WinCom.DEFAULT_CHANNEL;
	this._origin = options.origin || '*';

	Operator.register(this);
}
util.inherits(WinCom, Emitter);

WinCom.DEFAULT_CHANNEL = '__default__';

WinCom.prototype.getWindow = function() {
	return this._targetWindow;
};

WinCom.prototype.getChannel = function() {
	return this._channel;
};

WinCom.prototype.getOrigin = function() {
	return this._origin;
};

WinCom.prototype.post = function(msg) {
	Operator.post(this, msg);
};

WinCom.prototype.process = function(msg) {
	this.dispatchEvent(new CustomEvent('message', {detail: msg}));
};


(function() {
	util.addEventListener(window, 'message', Operator.receiveMessage);
})();
