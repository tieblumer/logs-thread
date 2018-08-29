module.exports = {
	init
};

function init(app, db) {
	app.get("/timeGroups", wait(loadTimeGroups, db));
	app.get("/list", wait(loadLogs, db));
	app.get("/log", wait(loadLog, db));
}

function wait(func, ...args) {
	return async function(req, res) {
		try {
			await func(req, res, ...args);
		} catch (err) {
			res.send(err.message);
		}
	};
}

async function loadLogs(req, res, db) {
	const data = JSON.parse(req.query.data);
	data.before = new Date(data.before);
	res.send(await db.loadThreadsSummaries(data));
}

async function loadLog(req, res, db) {
	const data = JSON.parse(req.query.data);
	res.send(await db.loadThreadFullInfo(data));
}

async function loadTimeGroups(req, res, db) {
	const names = await db.getTimeGroups();
	res.send({ timeGroups: names });
}
