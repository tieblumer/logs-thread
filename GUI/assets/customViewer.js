/* global HTMLReadyElement, prettyDate */
let threadViewer;
let jsonHolder;

class LogViewer extends HTMLReadyElement {
	constructor() {
		super();
		window.logViewer = this;
	}
	onReady() {
		this.json = this.getElementsByTagName("log-json")[0];
	}
	showInfo(info) {
		const cloned = JSON.parse(JSON.stringify(info));

		this.style.display = "block";
		this.closeFunction = e => this.closeWindow(e);
		document.addEventListener("click", this.closeWindow);
		threadViewer.removeChildren();
		jsonHolder.removeChildren();
		const initDate = new Date(info.date);
		info.thread.forEach(log => {
			const entry = document.createElement("thread-title");
			entry.setInfo(log.msg, initDate, new Date(log.date));
			threadViewer.appendChild(entry);

			if (log.stack) entry.setStack(log.stack);
		});
		const response = document.createElement("thread-title");
		response.setInfo("response", initDate, new Date(info.finish));
		threadViewer.appendChild(response);

		delete cloned.thread;
		delete cloned.method;
		delete cloned.path;

		const time = {
			startedAt: prettyDate(new Date(cloned.date), true),
			finishedAt: prettyDate(new Date(cloned.finish), true)
		};
		delete cloned.date;
		delete cloned.finish;
		jsonHolder.showInfo("time", time);

		if (cloned.query) {
			jsonHolder.showPropertyAndDelete("query", cloned, "query");
		}

		if (cloned.body) {
			jsonHolder.showPropertyAndDelete("body", cloned, "body");
		}

		if (cloned.debug) {
			jsonHolder.showPropertyAndDelete("debug", cloned, "debug");
		}

		if (cloned.response) {
			jsonHolder.showPropertyAndDelete("response", cloned, "response");
		}

		jsonHolder.showInfo("others", cloned);
	}
	closeWindow(event) {
		let target = event.target;

		while (target) {
			if (target.tagName === "LOG-TITLE") {
				break;
			}

			if (target === window.logViewer) return;
			target = target.parentElement;
		}
		window.logViewer.style.display = "";
		document.removeEventListener("click", window.logViewer.closeWindow);
	}
}
customElements.define("log-viewer", LogViewer);

class JSONHolder extends HTMLElement {
	constructor() {
		super();
		jsonHolder = this;
	}

	removeChildren() {
		while (this.lastChild) {
			this.removeChild(this.lastChild);
		}
	}
	showPropertyAndDelete(title, log, property) {
		this.showInfo(title, log[property]);
		delete log[property];
	}
	showInfo(title, info) {
		const viewer = document.createElement("json-viewer");
		this.appendChild(viewer);
		viewer.showJSON(title, info);
		return viewer;
	}
}
customElements.define("json-holder", JSONHolder);

class JSONViewer extends HTMLReadyElement {
	constructor() {
		super();
	}
	async showJSON(title, info) {
		await this.isReady;
		this.label = document.createElement("json-label");
		this.body = document.createElement("json-body");
		this.appendChild(this.label);
		this.appendChild(this.body);
		this.label.innerHTML = title;
		this.body.innerHTML = JSON.stringify(info, undefined, "    ");
	}
}
customElements.define("json-viewer", JSONViewer);

class ThreadViewer extends HTMLElement {
	constructor() {
		super();
		threadViewer = this;
	}
	removeChildren() {
		while (this.lastChild) {
			this.removeChild(this.lastChild);
		}
	}
}
customElements.define("log-thread", ThreadViewer);

class ThreadTitle extends HTMLElement {
	constructor() {
		super();
	}
	setInfo(title, start, finish) {
		const titleDiv = document.createElement("div");
		titleDiv.innerHTML = `${finish.getTime() - start.getTime()}ms: <b>${title}</b>`;
		this.appendChild(titleDiv);
	}
	setStack(stack) {
		const holder = document.createElement("div");
		this.parentElement.appendChild(holder);

		stack.forEach(line => {
			const div = document.createElement("thread-line");
			div.setInfo(line);
			holder.appendChild(div);
		});
	}
}
customElements.define("thread-title", ThreadTitle);

class ThreadLine extends HTMLElement {
	constructor() {
		super();
	}
	setInfo(text) {
		this.innerHTML = text;
	}
}
customElements.define("thread-line", ThreadLine);
