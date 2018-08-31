const Log = require("./Log");
const operations = require("./utils/operations");

let settings;
let db;
let isDebugging = false;

class Thread {
	constructor(req) {
		this.req = req;
		this.logs = [];
		this.startDate = new Date();
	}
	log(type, custom, message, debug) {
		try {
			const log = new Log(type, custom, message, debug);
			log.parent = this;
			this.logs.push(log);
			return log;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}
	debug(type, custom, message, debug) {
		try {
			if (!isDebugging) return;
			return this.log(type, custom, message, debug);
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}
	setResponse(response) {
		try {
			if (this.hasResponse) throw new Error("This thread already has a response");
			this.hasResponse = true;
			this.responseDate = new Date();

			this.response = response;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}
	setMsg(text) {
		try {
			this.message = text;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}
	flatten() {
		const flat = {};

		const logs = settings.express[this.req.method.toLowerCase()].log;
		logs.forEach(instruction => {
			if (["method", "path", "query", "body"].includes(instruction)) {
				flat[instruction] = this.req[instruction];
			} else if (instruction === "response") {
				flat.response = this.response;
			} else if (instruction === "time") {
				flat.date = this.startDate;
				const endDate = operations.last(this.logs.map(log => log.date));

				if (this.responseDate) {
					flat.finish = new Date(Math.max(this.responseDate, endDate));
				} else {
					flat.finish = endDate;
				}
			} else if (instruction === "stack") {
				flat.thread = this.logs.map(log => ({
					date: log.date,
					msg: log.message || log.type + " log",
					stack: log.stack
				}));
			}
		});

		for (const groupName in settings.groups) {
			const group = settings.groups[groupName];
			const values = this.logs.map(log => log[groupName]);
			flat[groupName] = operations[group.overlap](values, group.options);
		}

		flat.debug = operations.merge(this.logs.map(log => log.debug), {});
		flat.message = this.message || operations.last(this.logs.map(log => log.message));
		return flat;
	}
	save() {
		this.hasFinished = true;
		const logInfo = this.flatten();
		db.saveThread(logInfo);
	}
}

Thread.setup = function(config) {
	settings = Thread.settings = config.settings;
	db = Thread.db = config.db;
	Log.setup(settings);
};

Thread.debug = function(bool) {
	isDebugging = bool;
};

module.exports = Thread;
