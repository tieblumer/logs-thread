module.exports = {
	init
};

const GUI = require("../GUI");
const Thread = require("./Thread");

function init(express, app, settings, db) {
	GUI.init(express, db, settings);
	Thread.setup({ settings, db });

	app.use(addLogsThread.bind(undefined, settings));
}

function addLogsThread(settings, req, res, next) {
	if (!settings.express[req.method.toLowerCase()]) {
		return next();
	}
	req.thread = new Thread(req);
	req.thread.log("note", {}, req.method.toLowerCase() + " " + req.path);

	const _send = res.send;

	const hangup = setTimeout(finishThread, 120000);

	function finishThread() {
		if (!req.thread.hasFinished) {
			req.thread.save();
		}
		clearTimeout(hangup);
	}
	res.on("finish", finishThread);
	res.on("close", finishThread);

	res.send = function(data) {
		req.thread.setResponse(data);
		req.thread.save();
		res.send = _send;
		_send.apply(res, arguments);
	};

	next();
}
