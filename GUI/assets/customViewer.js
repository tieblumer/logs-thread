/* global HTMLReadyElement */
let threadViewer;

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
		this.json.showJSON(cloned);
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

class LogJSON extends HTMLElement {
	constructor() {
		super();
	}
	showJSON(log) {
		this.innerHTML = JSON.stringify(log, undefined, "    ");
	}
}
customElements.define("log-json", LogJSON);

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
