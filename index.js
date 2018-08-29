module.exports = {
	setModules,
	setCustomSettings,
	start
	// newThread - TODO - allow Threads to be used without a req
};

const fs = require("fs");
const joinPath = require("path").join;
const dumpOver = require("./utils/merge").mergeObjects;

////////////////////////////////
// MODULES
// logsThread asks the programmer to pass a reference to the modules they are using
// this way we avoid to load and install redundant code.
////////////////////////////////

// An object used to store references to the relevant modules being used in the current program.
const modules = {};

/**
 * Pass references of the relevant modules being used by your project:
 * 'express' a reference to "express";
 * 'app' the app created with express();
 * 'mongoose' a reference to require("mongoose") if db.type is "mongoose"
 * @param {Object} modulesReference
 */
function setModules(modulesReference) {
	for (const k in modulesReference) {
		modules[k] = modulesReference[k];
	}
}

////////////////////////////////
// SETTINGS
////////////////////////////////

// This object stores the logsThread default settings and will be modified by the project's custom settings.
const settings = require("./defaultSettings");

/**
 * Overwrites any default settings with your own custom settings.
 * You can pass either an object or the path to a JSON file.
 * @param {object|string} filePath_or_settingsObject
 * @returns The loaded settings object. Any changes made to this object before calling "start" will affect the reqLog setup.
 */
function setCustomSettings(filePath_or_settingsObject) {
	const customSettings = loadSettings(filePath_or_settingsObject);
	dumpOver(customSettings, settings);

	// autofill the settings.groups.type.options array with each key of the settings.types object
	for (const k in settings.types) {
		if (settings.types[k]) {
			settings.groups.type.options.push(k);
		}
	}
	return settings;
}

function loadSettings(filePath_or_settingsObject) {
	let customSettings;

	if (typeof filePath_or_settingsObject === "string") {
		let path = filePath_or_settingsObject;

		if (path.indexOf(".json") === -1) {
			path += ".json";
		}

		const absolute = path;
		const relative = joinPath(process.mainModule.paths[0], "../", absolute);
		const file = loadFile(absolute) || loadFile(relative);

		if (!file) {
			throw new Error("Couldn't find a valid json in either " + absolute + " or " + relative);
		}
		customSettings = JSON.parse(file);
	} else if (typeof filePath_or_settingsObject === "object") {
		customSettings = filePath_or_settingsObject;
	} else if (!filePath_or_settingsObject) {
		customSettings = {};
	} else {
		throw new Error("You must provide either an object or a route to a json file");
	}

	return customSettings;
}

function loadFile(path) {
	try {
		const file = fs.readFileSync(path, "utf-8");
		return file;
	} catch (err) {
		return null;
	}
}

////////////////////////////////
// START
////////////////////////////////

const expressPlugin = require("./req");

/**
 * Starts the logsThread engine.
 * Optionally it can defines the module references and the customSettings in this same call.
 * @param {object} modulesReference calls setModules
 * @param {object|string} filePath_or_settingsObject calls setCustomSettings
 */
function start(modulesReference, filePath_or_settingsObject) {
	if (modulesReference) setModules(modulesReference);

	if (filePath_or_settingsObject) setCustomSettings(filePath_or_settingsObject);

	//eslint-disable-next-line global-require
	const dbPlugin = require("./dbs/" + settings.db.type);
	dbPlugin.initPlugin(modules, settings);

	expressPlugin.init(modules.express, modules.app, settings, dbPlugin);
}
