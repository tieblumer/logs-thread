let settings;
let root;

const path = require("path");
const digestStack = require("../utils/stack").digest;

class Log {
	constructor (type, custom = {}, message = "", debug = {}) {
		try {
			this.type = type;
			this.debug = debug;
			this.date = new Date();

			this.setInfo(custom);

			if (message) {
				this.message = message;
			}

			this.stack = digestStack(new Error("").stack, root);
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	get type () {
		return this._type;
	}

	set type (type) {
		this._type = type;
		const log = settings.types[type];

		if (!log) {
			throw new Error(
				type + " is not a valid Log type. Please add it to your logsThread settings file."
			);
		}

		for (const k in log) {
			this[k] = log[k];
		}
	}

	setDebug (data) {
		try {
			this.debug = data;
			return this;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	setMsg (text, isImportant) {
		try {
			this.message = text;

			if (isImportant && this.parent) {
				this.parent.setMsg(text);
			}

			return this;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	setInfo (info) {
		try {
			for (const groupName in info) {
				const group = settings.groups[groupName];

				if (!group) {
					throw new Error(
						`${groupName} is not a valid group. Please add it to your logsThread custom settings or check for typos`
					);
				}

				const value = info[groupName];

				if (Array.isArray(value)) {
					value.forEach(name => {
						if (group.options.indexOf(name) === -1) {
							throw new Error(
								`${name} is not a valid option for ${groupName} group. Please add it to your logsThread custom settings or check for typos`
							);
						}
					});
				} else if (group.options.indexOf(value) === -1) {
					throw new Error(
						`${value} is not a valid option for ${groupName} group. Please add it to your logsThread custom settings or check for typos`
					);
				}

				this[groupName] = info[groupName];
			}

			return this;
		} catch (err) {
			this.type = "unexpected";
			this.error(err);
			throw err;
		}
	}

	/**
	 * Takes an instance of Error or logsThread Log and adds its relevant parts into this log
	 * @param {Error|Log} error  an instance of Error or logsThread Log ( the value returned by req.log() )
	 */
	error (error) {
		if (this.type === "unexpected" && this.parent) {
			this.parent.setMsg(error.message);
		}

		this.message = error.message;
		this.stack = digestStack(error.stack, root);
		return this;
	}

	/**
	 * throw this Log, interrupting the normal flow of the function
	 */
	throw () {
		throw this;
	}

	req (req, endpoint, method) {
		try {
			this.path = req.path;
			return this;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}
}

Log.setup = function (_settings) {
	settings = _settings;
	root = path.join(process.mainModule.paths[0], "../", settings.stackRoot).split("\\").join("/");
};

module.exports = Log;
