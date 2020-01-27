const fs = require("fs");
const joinPath = require("path").join;
const dumpAOverB = require("./utils/merge").mergeObjects;
const Log = require("./req/Log");
const operations = require("./req/utils/operations");
const expressPlugin = require("./req");

let started = false;

/**
 * Pass references of the relevant modules being used by your project:
 * 'express' a reference to "express";
 * 'app' the app created with express();
 * 'mongoose' a reference to require("mongoose") if db.type is "mongoose"
 * @param {Object} modulesReference
 */
function setModules (modulesReference) {
	/* eslint-disable global-require, no-use-before-define */
	const modules = {};

	for (const k in modulesReference) {
		modules[k] = modulesReference[k];
	}

	if (!modules.mongoose) {
		modules.mongoose = require("mongoose");
	}

	if (!modules.express) {
		modules.express = require("express");
	}

	if (!modules.app) {
		modules.app = modules.express();
	} else {
		debugger;
		modules.app.use(Thread.middleware);
	}

	return modules;
	/* eslint-enable global-require, no-use-before-define */
}

// This object stores the logsThread default settings and will be modified by the project's custom settings.
const settings = require("./defaultSettings");

/**
 * Overwrites any default settings with your own custom settings.
 * You can pass either an object or the path to a JSON file.
 * @param {object|string} settingsInfo
 * @returns The loaded settings object. Any changes made to this object before calling "start" will affect the reqLog setup.
 */
function setCustomSettings (settingsInfo) {
	const customSettings = loadSettings(settingsInfo);
	dumpAOverB(customSettings, settings);

	// autofill the settings.groups.type.options array with each key of the settings.types object
	for (const k in settings.types) {
		if (settings.types[k]) {
			settings.groups.type.options.push(k);
		}
	}

	return settings;
}

function loadSettings (info = {}) {
	if (typeof info === "string") {
		return loadSettingsFromPath(info);
	} else if (typeof info === "object" && info) {
		return info;
	}

	throw new Error("You must provide either an object or a path to a json file");
}

function loadSettingsFromPath (path) {
	if (path.indexOf(".json") === -1) {
		// eslint-disable-next-line no-param-reassign
		path += ".json";
	}

	const absolute = path;
	const relative = joinPath(process.mainModule.paths[0], "../", absolute);
	const file = loadFile(absolute) || loadFile(relative);

	if (!file) {
		throw new Error("Couldn't find a valid json in either " + absolute + " or " + relative);
	}

	return JSON.parse(file);
}

function loadFile (path) {
	try {
		const file = fs.readFileSync(path, "utf-8");
		return file;
	} catch (err) {
		return null;
	}
}

function overwriteResSend (res, req) {
	const _send = res.send;

	res.send = function (data) {
		req.thread.setResponse(data);
		req.thread.save();
		res.send = _send;
		_send.apply(res, arguments);
	};
}

function middleware (req, res, next) {
	if (!settings.express[req.method.toLowerCase()]) {
		return next();
	}

	req.thread = new Thread(req);
	req.thread.log("note", {}, req.method.toLowerCase() + " " + req.path);

	const hangup = setTimeout(finishThread, 120 * 1000);

	function finishThread () {
		clearTimeout(hangup);
		if (!req.thread.hasFinished) {
			req.thread.save();
		}
	}
	res.on("finish", finishThread);
	res.on("close", finishThread);

	overwriteResSend(res, req);

	next();
}

class Thread {
	/**
	 * Starts the logsThread engine.
	 * Optionally it can defines the module references and the customSettings in this same call.
	 * @param {object} modulesReference calls setModules
	 * @param {object|string} customSettings calls setCustomSettings
	 */
	static start (modulesReference = {}, customSettings = {}) {
		if (started) {
			throw new Error("LogsThreads already started.");
		}

		started = true;

		const modules = setModules(modulesReference);
		setCustomSettings(customSettings);

		//eslint-disable-next-line global-require
		const dbPlugin = require("./dbs/" + settings.db.type);
		dbPlugin.initPlugin(modules, settings);
		settings.dbPlugin = dbPlugin;

		expressPlugin.init(modules.express, modules.app, settings, dbPlugin);
	}

	static get middleware () {
		if (arguments.length) {
			throw new Error("Please use middleware instead of middleware().");
		}

		Thread.start();

		return middleware;
	}

	constructor (req) {
		if (!started) {
			Thread.start();
		}

		this.req = req;
		this.logs = [];
		this.startDate = new Date();
	}

	log (type, custom, message, debug) {
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

	debug (type, custom, message, debug) {
		try {
			if (!settings.debug) {
				return;
			}

			return this.log(type, custom, message, debug);
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	setResponse (response) {
		try {
			if (this.hasResponse) {
				throw new Error("This thread already has a response");
			}

			this.hasResponse = true;
			this.responseDate = new Date();

			this.response = response;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	error (error) {
		try {
			const log = new Log("unexpected");
			log.error(error);
			log.parent = this;
			this.logs.push(log);
			return log;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	setMsg (text) {
		try {
			this.message = text;
		} catch (err) {
			const log = new Log("unexpected");
			log.error(err);
			throw err;
		}
	}

	extractDefaultInfo () {
		const info = {};
		info.date = this.startDate;
		const endDate = operations.last(this.logs.map(log => log.date));

		if (this.responseDate) {
			info.finish = new Date(Math.max(this.responseDate, endDate));
		} else {
			info.finish = endDate;
		}

		info.thread = this.logs.map(log => ({
			date : log.date,
			msg  : log.message || log.type + " log",
			stack: log.stack
		}));

		return info;
	}

	extractInfoFromReq () {
		const info = {};
		const props = settings.express[this.req.method.toLowerCase()].log;

		props.forEach(prop => {
			if (["method", "path", "query", "body"].includes(prop)) {
				info[prop] = this.req[props];
			} else if (prop === "response") {
				info.response = this.response;
			}
		});
		return info;
	}

	extractInfoFromGrouos () {
		const info = {};

		for (const groupName in settings.groups) {
			const group = settings.groups[groupName];
			const values = this.logs.map(log => log[groupName]);
			info[groupName] = operations[group.overlap](values, group.options);
		}

		return info;

	}

	flatten () {
		const flat = this.extractDefaultInfo();
		if (this.req) {
			dumpAOverB(this.extractInfoFromReq(), flat);
		}

		dumpAOverB(this.extractInfoFromGrouos(), flat);

		flat.debug = operations.merge(this.logs.map(log => log.debug), {});
		flat.message = this.message || operations.last(this.logs.map(log => log.message));
		return flat;
	}

	save () {
		this.hasFinished = true;
		const logInfo = this.flatten();
		settings.dbPlugin.saveThread(logInfo);
	}
}
module.exports = Thread;

