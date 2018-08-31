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

function prettyDate(date, showMilli) {
	const pretty = date.toLocaleString();

	if (!showMilli) return pretty;

	const insertAt = pretty.lastIndexOf(":") + 3;
	let mili = date.getMilliseconds();

	while (mili.length < 3) mili = "0" + mili;
	const withMilli = pretty.substr(0, insertAt) + "." + mili + pretty.substr(insertAt);
	return withMilli;
}
