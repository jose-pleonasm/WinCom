(function(ns) {
	'use strict';

	ns.AppClient = App;

	function App(targetWindow) {
		this._targetWindow = targetWindow;
	}

	App.prototype.run = function() {
		this._wc = new WinCom(this._targetWindow, 'test');

		this._wc.addEventListener('message', this._receiveMessage.bind(this), false);

		setTimeout(
			this.send.bind(this, 'Message from client', '*'),
			1000
		);
	};

	App.prototype.send = function(message, origin) {
		this._wc.post(message, origin);
	};

	App.prototype._receiveMessage = function(event) {
		console.log(event);
	};
})(window);