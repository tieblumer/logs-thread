module.exports = {
	create: createSchema
};

function createSchema (mongoose, groups) {
	const info = getInfoTemplate();

	for (const groupName in groups) {
		const group = groups[groupName];

		const type = typeof group.options[0];
		const multi = group.options.find(option => typeof option !== type);
		const sparse = !group.optional;

		if (multi) {
			info[groupName] = {type: {}, strict: false, index: {sparse}};
		} else if (["push", "pull"].includes(group.overlap)) {
			info[groupName] = {type: [type], index: {sparse}};
		} else {
			info[groupName] = {type, index: {sparse}};
		}
	}

	const schema = ensambleSchema(mongoose, info);
	return schema;
}

function getInfoTemplate () {
	return {
		response: {},
		debug   : {},
		query   : {},
		body    : {},
		thread  : {},
		path    : String,
		method  : String,
		date    : {type: Date, default: Date.now, index: -1},
		finish  : {type: Date, default: Date.now, index: -1},
		message : String
	};
}

function ensambleSchema (mongoose, info) {
	const schema = new mongoose.Schema(info);

	schema.pre("save", function (next) {
		// eslint-disable-next-line no-invalid-this
		clearRecursive(this);
		next();
	});

	return schema;
}

function clearRecursive (info) {
	for (const k in info) {
		const value = info[k];

		if (typeof value === "object") {
			if (Array.isArray(value)) {
				if (!value.length) {
					info[k] = undefined;
				}

				value.forEach(child => clearRecursive(child));
			} else if (value.constructor === Object) {
				if (!["response", "debug", "query", "body"].includes(k)) {
					clearRecursive(value);
				}

				if (Object.keys(value) === 0) {
					info[k] = undefined;
				}
			}
		}
	}
}
