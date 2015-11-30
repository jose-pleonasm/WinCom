
var Operator = {};

Operator._connections = {};

Operator.register = function(channel, communicator) {
	Operator._connections[channel] = Operator._connections[channel] || [];

	Operator._connections[channel].push(communicator);
};

Operator._receiveMessage = function(event) {
	console.info(event);
};

function WinCom(targetWindow, channel) {
	channel = channel || WinCom.DEFAULT_CHANNEL;

	Emitter.call(this);

	this._targetWindow = targetWindow;
	this._channel = channel;
	this._origin = '*';

	Operator.register(this._channel, this);
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

WinCom.prototype.setOrigin = function(origin) {
	return this._origin = origin;
};

WinCom.prototype.post = function(msg) {
	this._targetWindow.postMessage(msg, this._origin);
};




(function() {
	util.addEventListener(window, 'message', Operator._receiveMessage);
})();
