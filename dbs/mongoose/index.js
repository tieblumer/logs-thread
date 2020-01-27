// Any database plugin needs to provide functionality for the following functions:
// save, load, info, getTimeGroups
module.exports = {
	initPlugin,
	getTimeGroups,
	saveThread,
	loadThreadsSummaries,
	loadThreadFullInfo
};

const initModels = require("./model").init;
const getModel = require("./model").get;
const connectDB = require("./db").create;
const getCollections = require("./db").getCollections;
let ObjectId;

/**
 * Receives the modules references and the final settings object to create the database connection
 * and setup the necessary schemas and models
 * @param {*} modules The modules references passed to logsThread so we can take mongoose from there
 * @param {*} settings The final settings (default + custom) to interpret how the schema should be
 * and which db and collections to use
 * @async
 */
async function initPlugin (modules, settings) {
	ObjectId = modules.mongoose.Types.ObjectId;
	const db = await connectDB(modules.mongoose, settings.db.host);
	initModels(db, modules.mongoose, settings);
}

async function getTimeGroups () {
	const names = await getCollections();
	return names.map(name => name.name);
}

/**
 * Saves a thread flattened information in the current database collection
 * @param {Object} flattenedThreadInfo The flattened thread info we want to save
 * @async
 * @returns the info converted to a mongoose object after it has being saved
 */
async function saveThread (flattenedThreadInfo) {
	const Model = getModel();
	const instance = new Model(flattenedThreadInfo);
	await instance.save();
	return instance;
}

async function loadThreadsSummaries (filter) {
	const model = getModel(filter.db);

	const match = {
		date: {$lte: filter.before}
	};
	filter.filters.forEach(group => match[group.name] = {$in: group.values});

	const logs = await model.find(
		match,
		{thread: 0, response: 0, body: 0, query: 0, finish: 0},
		{limit: filter.limit, lean: true, sort: {date: -1}}
	);
	return logs;
}

async function loadThreadFullInfo (data) {
	const model = getModel(data.db);

	const match = {
		_id: new ObjectId(data._id)
	};

	const log = await model.findOne(match, {}, {lean: true});
	return log;
}
