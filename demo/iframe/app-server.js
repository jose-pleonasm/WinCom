(function(ns) {
	'use strict';

	ns.AppServer = App;

	function App() {
		this._scene = null;
	}

	App.prototype.run = function() {
		this._scene = window.document.createElement('div');
		window.document.body.appendChild(this._scene);

		window.addEventListener('message', this._receiveMessage.bind(this), false);

		setTimeout(
			this.send.bind(this, 'Message from server', '*'),
			1000
		);
	};

	App.prototype.send = function(message, origin) {
		window.frames['parent'].postMessage(message, origin);
	};

	App.prototype._receiveMessage = function(event) {
		this._write('<em>' + event.origin + '</em>: ' + event.data);
	};

	App.prototype._write = function(msg) {
		var post = window.document.createElement('pre');
		post.innerHTML = msg.toString();
		this._scene.appendChild(post);
	};
})(window);