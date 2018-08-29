/* global ajax */
document.getElementById("loadLogsButton").addEventListener("mousedown", () => loadLogs());

let historyDate = [];
let nextDate;
let lastTime = null;

async function loadLogs(fromDate) {
	if (lastTime && fromDate === lastTime) return;

	if (fromDate) {
		if (lastTime) historyDate.push(lastTime);
		lastTime = fromDate;
		historyDate = historyDate.filter(date => date > lastTime);
	} else {
		lastTime = undefined;
		historyDate.length = 0;
	}
	const filters = window.allCombos.map(combo => combo.filter).filter(filter => !!filter);
	let limit = parseInt(document.getElementById("logsPerPage").value);

	if (isNaN(limit)) {
		limit = 50;
		document.getElementById("logsPerPage").value = limit;
	}
	//try {
	const logs = await ajax("/list", {
		filters,
		limit: limit,
		before: lastTime ? new Date(lastTime) : new Date(),
		db: window.db.value
	});

	if (logs.length) {
		nextDate = new Date(logs[logs.length - 1].date).getTime();
	} else {
		nextDate = undefined;
	}
	document.getElementById("logsHolder").setLogs(logs);
}

const pageButtons = document.getElementsByTagName("action-button");

for (let i = 0; i < pageButtons.length; i++) {
	const button = pageButtons[i];
	const action = button.getAttribute("action");

	if (action === "first") {
		button.addEventListener("click", () => loadLogs());
	} else if (action === "prev") {
		button.addEventListener("click", () => loadLogs(historyDate.pop()));
	} else if (action === "next") {
		button.addEventListener("click", () => loadLogs(nextDate));
	}
}

async function init() {
	await window.db.isReady;
	const response = await ajax("/timeGroups");
	await window.db.setGroups(response.timeGroups);
	loadLogs();
}
init();
