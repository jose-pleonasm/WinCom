(function(ns) {
	"use strict";

	function receiveMessage(event) {
		console.info(event.origin, event.data);
	}

	ns.App = {};

	App.run = function() {
		var $ = null;
		window.addEventListener("message", receiveMessage, false);
		$ = ns.$ = window.document.getElementById("testiframe").contentWindow;
		$.postMessage("#HOST test message", "*");
	};
})(window);
