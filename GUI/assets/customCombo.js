/* global HTMLReadyElement */

let lastInComboMode = null;
window.allCombos = [];
let groupZIndex = 1000;

class GroupFilter extends HTMLReadyElement {
	constructor() {
		super();
		window.allCombos.push(this);
	}
	onReady() {
		this.style.zIndex = groupZIndex--;

		this.display = this.getElementsByTagName("group-display")[0];
		this.combo = this.getElementsByTagName("group-combo")[0];
		this.holder = this.getElementsByTagName("group-holder")[0];
		this.buttons = this.getElementsByTagName("group-buttons")[0];

		const all = document.createElement("combo-icon");
		all.action = "all";
		all.innerHTML = "✓";
		all.root = this;
		this.buttons.appendChild(all);

		const none = document.createElement("combo-icon");
		none.action = "none";
		none.innerHTML = "✕";
		none.root = this;
		this.buttons.appendChild(none);

		this.groupOptions = this.getElementsByTagName("group-options")[0];
		this.groupTitle = this.getElementsByTagName("group-title")[0];
		this.displayTitle = this.getElementsByTagName("display-title")[0];
		this.displayContent = this.getElementsByTagName("display-content")[0];
		this.createKids();
		this.setMode("display");

		const goodTargets = [
			"GROUP-COMBO",
			"GROUP-DISPLAY",
			"DISPLAY-TITLE",
			"DISPLAY-CONTENT",
			"GROUP-TITLE",
			"OPTIONS-GROUP"
		];
		this.addEventListener("click", ev => {
			if (goodTargets.indexOf(ev.target.tagName) > -1) {
				this.toggle();
			} else {
				//console.log(ev.target.tagName);
			}
		});
	}
	get selectedOptions() {
		return this.groupOptions.kids
			.filter(groupOption => groupOption.checked)
			.map(groupOption => groupOption.value);
	}
	get filter() {
		const selectedOptions = this.selectedOptions;

		if (!selectedOptions.length) return null;
		return { name: this.getAttribute("label"), values: selectedOptions };
	}
	toggle() {
		if (this._mode === "combo") {
			this.setMode("display");
		} else {
			this.setMode("combo");
		}
	}
	async setMode(mode) {
		if (this._mode === mode) return;
		this._mode = mode;

		if (lastInComboMode) {
			lastInComboMode.setMode("display");
		}

		if (mode === "display") {
			if (lastInComboMode === this) lastInComboMode = null;
			this.holder.style.display = "none";
			this.display.style.display = "";
			await this.groupOptions.isReady;
			const values = this.groupOptions.kids
				.map(
					groupOption => (groupOption.checked ? groupOption.getAttribute("value") : null)
				)
				.filter(kid => !!kid);

			if (values.length === this.groupOptions.kids.length) {
				this.displayContent.text = "-";
			} else if (values.length === 0) {
				this.displayContent.text = "-";
			} else {
				this.displayContent.text = values.join(", ");
			}
		} else {
			lastInComboMode = this;
			this.holder.style.display = "";
			this.display.style.display = "none";

			const close = e => {
				let target = e.target;

				while (target) {
					if (target === this) return;
					target = target.parentElement;
				}
				document.removeEventListener("click", close);
				this.setMode("display");
			};
			document.addEventListener("click", close);
		}
	}
}
customElements.define("group-filter", GroupFilter);

class DisplayTitle extends HTMLElement {
	constructor() {
		super();
	}
}
customElements.define("display-title", DisplayTitle);

class DisplayContent extends HTMLElement {
	constructor() {
		super();
	}
	get text() {
		return this._text;
	}
	set text(value) {
		this._text = value;
		this.innerHTML = value;
	}
}
customElements.define("display-content", DisplayContent);

class GroupTitle extends HTMLElement {
	constructor() {
		super();
	}
	onReady() {
		this.innerHTML += '<combo-icon class="close" action="close">✕</combo-icon>';
	}
}
customElements.define("group-title", GroupTitle);

class ComboIcon extends HTMLElement {
	constructor() {
		super();
		this.addEventListener("click", () => {
			if (this.action === "close") {
				this.root.setMode("display");
			} else if (this.action === "all") {
				this.root.groupOptions.selectAll();
			} else if (this.action === "none") {
				this.root.groupOptions.deselectAll();
			}
		});
	}
}
customElements.define("combo-icon", ComboIcon);

class GroupOptions extends HTMLReadyElement {
	constructor() {
		super();
	}
	onReady() {
		this.createKids();
	}
	selectAll() {
		this.kids.forEach(groupOption => (groupOption.checked = true));
	}
	deselectAll() {
		this.kids.forEach(groupOption => (groupOption.checked = false));
	}
}
customElements.define("group-options", GroupOptions);

class GroupOption extends HTMLElement {
	constructor() {
		super();
		this.addEventListener("click", () => {
			this.checked = !this.checked;
		});
	}
	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "checked") {
			this.checked = newValue === true || newValue === "true";
		}

		if (name === "value") {
			this._value = newValue;
			this.innerHTML = newValue;
		}
	}
	get value() {
		return this._value;
	}
	get checked() {
		return this._checked;
	}
	set checked(bool) {
		if (this._checked === !!bool) return;
		this._checked = !!bool;

		if (this._checked) {
			this.classList.add("selected");
		} else {
			this.classList.remove("selected");
		}
	}
	static get observedAttributes() {
		return ["value", "checked"];
	}
}
customElements.define("group-option", GroupOption);

class CheckOption extends HTMLElement {
	constructor() {
		super();
	}
	attributeChangedCallback(name, oldValue, newValue) {}
	static get observedAttributes() {
		return ["checked"];
	}
}
customElements.define("check-option", CheckOption);
