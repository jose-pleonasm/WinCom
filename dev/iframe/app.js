(function(ns) {
	"use strict";

	var scene = null;

	function write(msg) {
		var post = window.document.createElement("pre");
		post.innerHTML = msg.toString();
		scene.appendChild(post);
	}

	function receiveMessage(event) {
		write("<em>" + event.origin + "</em>: " + event.data);
	}

	ns.App = {};

	App.run = function() {
		var $ = null;
		scene = window.document.getElementById("scene");
		window.addEventListener("message", receiveMessage, false);
		$ = ns.$ = window.parent;
		$.postMessage("#IFRAME test message", "*");
	};
})(window);
