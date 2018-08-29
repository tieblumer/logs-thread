function ajax(url, data) {
	const promise = new Promise((resolve, reject) => {
		try {
			const xhttp = new XMLHttpRequest();

			xhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (this.status == 200) {
						try {
							const json = JSON.parse(this.responseText);
							// to avoid try{ resolve() }
							setTimeout(resolve, 1, json);
						} catch (err) {
							reject("bad json: " + this.responseText);
						}
					} else {
						reject(this.status + ": " + this.statusText);
					}
				}
			};

			if (data) {
				const token = url.indexOf("?") === -1 ? "?" : "&";
				url += token + "data=" + JSON.stringify(data);
			}
			xhttp.open("GET", url, true);
			xhttp.send();
		} catch (err) {
			reject(err.message);
		}
	});
	return promise;
}

const dayFirst = new Date(2000, 0, 30).toLocaleDateString().charAt(0) === "3";

function prettyDate(date) {
	/*const iso = date.toISOString().split("T");
	let parts = iso[0]
		.slice(2)
		.split("-")
		.reverse();

	if (!dayFirst) {
		parts = [parts[1], parts[0], parts[2]];
	}
	const year = parts.join("/");
	return year + " " + iso[1].split(".")[0];*/
	return date.toLocaleString()
}
