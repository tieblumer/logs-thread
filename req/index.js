module.exports = {
	init
};

const GUI = require("../GUI");
const Thread = require("./Thread");

function init (express, app, settings, db) {
	GUI.init(express, db, settings);
	Thread.setup({settings, db});
}

