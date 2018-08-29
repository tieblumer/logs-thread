module.exports = {
	db: {
		type: "mongoose",
		host: "mongodb://localhost:27017/logsThread",
		group: "week" // day, week, month, year, none
	},
	GUI: {
		port: 12970,
		root: "./logsThread/"
	},
	express: {
		get: {
			log: ["method", "path", "query", "response", "time", "stack"],
			blackList: [],
			whiteList: []
		},
		post: {
			log: ["method", "path", "query", /*"body",*/ "response", "time", "stack"],
			blackList: [],
			whiteList: []
		}
	},
	stackRoot: "./",
	groups: {
		type: { options: [], overlap: "push", optional: false }, // autofill from settings.types[k]
		level: { options: ["error", "warn", "log"], overlap: "minIndex" },
		importance: { options: ["high", "normal", "low"], overlap: "minIndex" }
	},
	types: {
		note: {
			level: "log",
			importance: "normal"
		},
		unexpected: {
			message: "unexpected error",
			level: "error",
			importance: "high"
		}
	}
};
