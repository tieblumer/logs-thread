module.exports = {
	digest
};

/**
 * transforms an error.stack text into a line array, keeps only those under the settings.stackRoot directory,
 * eliminates those inside node_modules or logs-thread directories and keeps only the relevant parts of each line
 * @param {string} stack an error stack
 * @returns {Array} an array with each of the relevant parts of each valid stack line
 */
function digest (stack = "", root = "", ignore = ["node_modules"]) {
	const stackLines = stack
		.replace(/\\/g, "/")
		.replace(/\n {4}at/g, "\n")
		.split("\n")
		.filter(line => isValidStack(line, root, ignore))
		.map(line => relevantStackPart(line, root));

	return stackLines;
}

function isValidStack (stack, root = "", ignore) {
	if (ignore.find(folderName => stack.indexOf(folderName) > -1)) {
		return false;
	}

	const isStackInValidRoot = stack.indexOf(root) > -1;
	return isStackInValidRoot;
}

function relevantStackPart (line, root = "") {
	const parts = line.split(root);
	parts.shift();
	const fromRoot = parts.join(root);
	const withoutCharsPosition = fromRoot.split(":").slice(0, 2);
	const relevant = withoutCharsPosition.join(":");

	return relevant;
}
