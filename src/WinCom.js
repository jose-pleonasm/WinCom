
function WinCom(targetWindow, channel) {
	channel = channel || WinCom.DEFAULT_CHANNEL;

	this._targetWindow = targetWindow;
	this._channel = channel;
}

WinCom.DEFAULT_CHANNEL = '__default__';
