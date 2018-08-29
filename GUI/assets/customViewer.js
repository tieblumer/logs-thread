/* global HTMLReadyElement */
class LogViewer extends HTMLReadyElement {
	constructor() {
		super();
		window.logViewer = this;
	}
	onReady() {
		this.json = this.getElementsByTagName("log-json")[0];
	}
	showInfo(log) {
		this.style.display = "block";
		this.json.showJSON(log);
		this.closeFunction = e => this.closeWindow(e);
		document.addEventListener("click", this.closeWindow);
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
