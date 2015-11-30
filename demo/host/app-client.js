(function(ns) {
	'use strict';

	ns.AppClient = App;

	function App(targetWindow) {
		this._targetWindow = targetWindow;
	}

	App.prototype.run = function() {
		window.addEventListener('message', this._receiveMessage.bind(this), false);

		setTimeout(
			this.send.bind(this, 'Message from client', '*'),
			1000
		);
	};

	App.prototype.send = function(message, origin) {
		this._targetWindow.postMessage(message, origin);
	};

	App.prototype._receiveMessage = function(event) {
		console.log(event);
	};
})(window);