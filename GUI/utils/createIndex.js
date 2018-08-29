module.exports = {
	compile
};

const fs = require("fs");
const path = require("path");

function compile(settings) {
	const _htmlPath = path.join(__dirname, "../assets/_index.html");
	const htmlPath = path.join(__dirname, "../assets/index.html");
	const file = fs.readFileSync(_htmlPath, "utf-8");

	const allGroups = Object.keys(settings.groups);
	const customGroups = allGroups.filter(
		group => ["type", "importance", "level"].indexOf(group) === -1
	);

	const globalVars = `window.logsThread = {
		groups:["${allGroups.join('", "')}"],
		customGroups:["${customGroups.join('", "')}"]
	}`;
	const groups = createGroups(settings);
	fs.writeFileSync(
		htmlPath,
		file.replace("/* GROUPS */", groups).replace("/* GLOBAL_VARS */", globalVars),
		"utf-8"
	);
}

function createGroups(settings) {
	const groups = [];

	for (const groupName in settings.groups) {
		const group = settings.groups[groupName];
		const html = createGroupHTML(group, groupName);
		groups.push(html);
	}
	return groups.join("");
}

function createGroupHTML(group, groupName) {
	return `<group-filter label="${groupName}">
		<group-display>
			<display-title>${groupName.toUpperCase()}</display-title>
			<display-content></display-content>
		</group-display>
		<group-holder>
			<group-combo>
				<group-title>${groupName.toUpperCase()}</group-title>
				<group-options>
					${group.options
						.map(option => {
							return `<group-option value="${option}" checked="false"></group-option>`;
						})
						.join("\n")} 
				</group-options>
				<group-buttons>
				</group-buttons>
			</group-combo>
		</group-holder>
	</group-filter>`;
}
