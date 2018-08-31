class HTMLReadyElement extends HTMLElement {
	constructor() {
		super();
		this.isReady = new Promise(resolve => {
			const check = () => {
				if (!this.innerHTML && !this.parentElement) return setTimeout(() => check(), 1);
				return setTimeout(() => {
					if (this.onReady) this.onReady();
					this.isReady = true;
					resolve(true);
				}, 1);
			};
			check();
		});
	}
	createKids() {
		const kids = [];

		for (let i = 0; i < this.children.length; i++) {
			kids.push(this.children[i]);
		}
		this.kids = kids;
		return kids;
	}
	waitFor(id) {
		return new Promise(resolve => {
			let checkInterval;
			let value;

			function check() {
				value = document.getElementById(id);

				if (value) resolve(value);
			}

			if (!check()) {
				checkInterval = setInterval(check.bind(this), 2);
			} else {
				clearInterval(checkInterval);
			}
		});
	}
}

class ActionButton extends HTMLElement {
	constructor() {
		super();
	}
	setLog(log) {
		this.innerHTML = log.message;
	}
}
customElements.define("action-button", ActionButton);

class TimeGroups extends HTMLReadyElement {
	constructor() {
		super();
		window.db = this;
	}
	onReady() {
		this.combo = document.createElement("select");
		this.appendChild(this.combo);
	}

	async setGroups(names) {
		await this.isReady;

		while (this.combo.lastChild) {
			this.combo.removeChild(this.combo.lastChild);
		}
		names.sort((a, b) => (a < b ? 1 : -1)).forEach(name => {
			const option = document.createElement("option");
			option.text = option.value = name;
			this.combo.appendChild(option);
		});
	}

	get value() {
		return this.combo.value;
	}
}
customElements.define("time-groups", TimeGroups);

let dateTranslator;

class DateTranslator extends HTMLElement {
	constructor() {
		super();
		dateTranslator = this;
	}
	fromISOString(ISOString) {
		this.innerHTML = new Date(ISOString).toLocaleString();
	}
}
customElements.define("date-translator", DateTranslator);
