module.exports = {
	mergeObjects: merge
};

function merge (reference, affected, clone) {
	const singleObjects = [];

	if (clone) {
		const cloned = JSON.stringify(JSON.parse(affected));
		return recursive(reference, cloned, singleObjects);
	}

	return recursive(reference, affected, singleObjects);
}

function recursive (reference, affected, singleObjects) {
	singleObjects.push(reference);

	for (const k in reference) {
		const value = reference[k];

		if (typeof value === "object") {
			if (Array.isArray(value) || value === null) {
				affected[k] = value;
			} else {
				if (!affected[k]) {
					affected[k] = {};
				}

				if (!singleObjects.includes(value)) {
					recursive(value, affected[k], singleObjects);
				}
			}
		} else {
			affected[k] = value;
		}
	}
}
