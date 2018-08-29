module.exports = {
	create: connect,
	getCollections
};

let db;

function connect(mongoose, host) {
	return new Promise((resolve, reject) => {
		db = mongoose.createConnection(host, function(err) {
			if (err) return reject(err);
			resolve(db);
		});
	});
}

async function getCollections() {
	const names = await db.db.listCollections().toArray();
	return names;
}
