module.exports = {
	init
};

const fs = require("fs");
const _path = require("path");
const createIndex = require("./utils/createIndex").compile;
const digestStack = require("../utils/stack").digest;
const routes = require("./routes");

let settings;
let publicFolder;
const FORCE_CREATION = true; // if true the files will always be overwritten. Useful for this library development

async function GUIIndex (req, res, next) {
	try {
		console.log("ok");
		await checkIndexHTML();
		next();
	} catch (err) {
		res.send(err.message);
		console.log(err.message);
		console.log(digestStack(err.stack, __dirname + "/").join("\n"));
	}
}

function init (express, db, _settings) {
	settings = _settings;
	const GUI = express();
	publicFolder = getPublicFolder();

	// ensures there an index.html created at the current project
	GUI.get("/", GUIIndex);
	GUI.use(express.static(publicFolder));
	routes.init(GUI, db);

	const server = GUI.listen(settings.GUI.port);
	server.once("error", () => {});
	console.log("LOGS-THREAD GUI running at http://localhost:" + settings.GUI.port);
}

function getPublicFolder () {
	let folder = settings.GUI.root;

	if (folder.charAt(0) === ".") {
		folder = _path.join(process.mainModule.paths[0], "../", folder);
	}

	if (folder.charAt(folder.length - 1) !== "/") {
		folder += "/";
	}

	return folder;
}

function checkIndexHTML () {
	if (!fs.existsSync(publicFolder)) {
		createRootDirectoryInProject(publicFolder);
	}

	if (missing("index.html")) {
		createIndex(settings);
		copyFile("index.html");
	}

	console.log("creating logs-thread GUI files at " + publicFolder);
	ifMissingThenCreate("main.css");
	ifMissingThenCreate("main.js");
	ifMissingThenCreate("custom.js");
	ifMissingThenCreate("customCombo.js");
	ifMissingThenCreate("customLog.js");
	ifMissingThenCreate("customViewer.js");
	ifMissingThenCreate("utils.js");
}

function createRootDirectoryInProject (targetDir) {
	const sep = _path.sep;
	const initDir = _path.isAbsolute(targetDir) ? sep : "";
	const baseDir = ".";

	return targetDir.split(sep).reduce((parentDir, childDir) => {
		const curDir = _path.resolve(baseDir, parentDir, childDir);

		try {
			if (!fs.existsSync(curDir)) {
				fs.mkdirSync(curDir);
			}
		} catch (err) {
			if (err.code === "EEXIST") {
				// curDir already exists!
				return curDir;
			}

			// To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
			if (err.code === "ENOENT") {
				// Throw the original parentDir error on curDir `ENOENT` failure.
				throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
			}

			const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;

			if (!caughtErr || caughtErr && targetDir === curDir) {
				throw err; // Throw if it's just the last created dir.
			}
		}

		return curDir;
	}, initDir);
}

function missing (fileName) {
	const path = _path.join(fileName);
	return !fs.existsSync(path) || FORCE_CREATION;
}

function copyFile (fileName) {
	const path = _path.join(publicFolder, fileName);
	const localPath = _path.join(__dirname, "./assets/", fileName);
	const localFile = fs.readFileSync(localPath, "utf-8");
	fs.writeFileSync(path, localFile, "utf-8");
}

function ifMissingThenCreate (fileName) {
	if (missing(fileName)) {
		copyFile(fileName);
	}
}
