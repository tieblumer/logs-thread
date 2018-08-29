/* global prettyDate, ajax */
class LogsHolder extends HTMLElement {
	constructor() {
		super();
	}
	setLogs(logs) {
		this.clear();

		logs.forEach(log => {
			for (const k in log) {
				const asDate = new Date(log[k]);

				if (!isNaN(asDate.getTime())) {
					log[k] = prettyDate(asDate);
				}
			}
		});

		this.headers = this.createHeaders(logs);

		const headerLog = {};
		Object.keys(this.headers).forEach(key => (headerLog[key] = key));

		const logChild = document.createElement("log-summary");
		logChild.setLog(headerLog, this.headers, true);
		this.appendChild(logChild);
		logChild.classList.add("header");

		logs.forEach(log => {
			const logChild = document.createElement("log-summary");
			logChild.setLog(log, this.headers);
			this.appendChild(logChild);
		});
	}
	clear() {
		this.innerHTML = "";
	}
	createHeaders(logs) {
		const headers = {};
		logs.forEach(log => {
			Object.keys(log).forEach(key => {
				if (key !== "date" && key !== "path" && key !== "method" && key !== "message") {
					if (window.logsThread.groups.indexOf(key) === -1) return;
				}

				if (!headers[key]) {
					headers[key] = key.length;
				}
				const value = log[key];
				const length = Array.isArray(value) ? value.join(", ").length : value.length;
				headers[key] = Math.max(headers[key], length || 0);
			});
		});

		for (const k in headers) {
			headers[k] = { key: k, length: Math.min(50, 1 + headers[k] || 0) };
		}

		const sorted = {};
		const order = ["date", "method", "path", "importance", "type", "level", "message"];
		order.filter(key => !!headers[key]).forEach(key => {
			sorted[key] = headers[key];
			delete headers[key];
		});
		Object.keys(headers)
			.sort()
			.forEach(key => (sorted[key] = headers[key]));

		let total = 0;
		Object.keys(sorted).forEach(key => (total += sorted[key].length || 0));
		Object.keys(sorted).forEach(key => (sorted[key].perc = sorted[key].length / total));
		return sorted;
	}
}
customElements.define("logs-holder", LogsHolder);

class logSummary extends HTMLReadyElement {
	constructor() {
		super();
		this.addEventListener("click", async () => {
			const info = await ajax("log", { _id: this._id, db: window.db.value });
			window.logViewer.showInfo(info);
		});
	}
	async setLog(log, headers, isHeader) {
		await this.isReady;

		this._id = log._id;
		const totalHeaders = Object.keys(headers).length;

		for (const k in headers) {
			const tab = document.createElement("log-tab");
			let info = log[k];
			tab.config(k, log[k] || "&nbsp;", headers[k].perc, 99.9 - totalHeaders);

			if (isHeader) info = "header";

			if (Array.isArray(info)) {
				info.forEach(value => this.addClass(value, tab));
			} else {
				this.addClass(info, tab);
			}
			this.appendChild(tab);
		}
	}
	addClass(value, tab) {
		try {
			this.classList.add(value);
			tab.classList.add(value);
		} catch (err) {}
	}
}
customElements.define("log-summary", logSummary);

class logTab extends HTMLReadyElement {
	constructor() {
		super();
	}
	config(label, text, width, maxPerc) {
		this.label(label);
		this.text(text);
		this.width(width, maxPerc);
	}
	label(value) {
		this.title = value;
	}
	text(value) {
		this.innerHTML = value;
	}
	width(value, maxPerc) {
		this.style.width = Math.round(value * maxPerc * 100) / 100 + "%";
	}
}
customElements.define("log-tab", logTab);
