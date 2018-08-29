module.exports = {
	get: getModel,
	init
};

const createSchema = require("./schema").create;
let schema;
let db;

const models = {};

let getCollection = function() {
	return "";
};

function init(dbInstance, mongoose, settings) {
	db = dbInstance;
	schema = createSchema(mongoose, settings.groups);
	setTimeGroup(settings.db.group);
}

function setTimeGroup(type) {
	//day, week, month, year, none

	if (type === "day") {
		getCollection = function() {
			return new Date()
				.toISOString()
				.split("T")[0]
				.replace(/[\-]/g, "_");
		};
	} else if (type === "week") {
		getCollection = function() {
			const year = new Date().getFullYear();
			const firstDay = new Date(year, 0, 1);
			const oneWeek = 1000 * 60 * 60 * 25 * 7;
			const week = Math.floor((Date.now() - firstDay) / oneWeek);
			return year + "_" + week;
		};
	} else if (type === "month") {
		getCollection = function() {
			return new Date()
				.toISOString()
				.split("_")
				.slice(0, 1)
				.join("_");
		};
	} else if (type === "year") {
		getCollection = function() {
			return new Date().getFullYear();
		};
	} else {
		getCollection = function() {
			return "logs";
		};
	}
}

function getModel(name) {
	const collectionName = name || getCollection();

	if (models[collectionName]) {
		return models[collectionName];
	}
	return createNewModel(collectionName);
}

function createNewModel(collectionName) {
	const model = db.model(collectionName, schema, collectionName);
	models[collectionName] = model;
	return model;
}
