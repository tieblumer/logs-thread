module.exports = {
	mergeObjects: merge
};

function merge (reference, affected, clone) {
	if (clone) {
		const cloned = JSON.stringify(JSON.parse(affected));
		return recursive(reference, cloned);
	}

	return recursive(reference, affected);
}

function recursive (reference, affected) {
	for (const k in reference) {
		const value = reference[k];

		if (typeof value === "object") {
			if (Array.isArray(value) || value === null) {
				affected[k] = value;
			} else {
				if (!affected[k]) {
					affected[k] = {};
				}

				recursive(value, affected[k]);
			}
		} else {
			affected[k] = value;
		}
	}
}
