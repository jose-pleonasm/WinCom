(function(ns) {
	'use strict';

	ns.AppClient = App;

	function App(targetWindow) {
		this._targetWindow = targetWindow;
		this._wc = null;
		this._wc2 = null;
	}

	App.prototype.run = function() {
		this._wc = new WinCom({
			targetWindow: this._targetWindow,
			targetOrigin: 'http://jose.stream.dev',
			channel: 'test'
		});
		this._wc2 = new WinCom({
			targetWindow: this._targetWindow,
			channel: 'foo'
		});

		this._wc .addEventListener('message', this._receiveMessage.bind(this, '#1'), false);
		this._wc2.addEventListener('message', this._receiveMessage.bind(this, '#2'), false);

		setTimeout(
			this.send.bind(this, 'Message from client', '*'),
			1000
		);
	};

	App.prototype.send = function(message, origin) {
		this._wc.post(message, origin);
	};

	App.prototype._receiveMessage = function(id, event) {
		console.info(id, event);
	};
})(window);