module.exports = {
	create: connect,
	getCollections
};

let db;

async function connect (mongoose, host) {
	db = await mongoose.createConnection(host, {useNewUrlParser: true, useUnifiedTopology: true});
	mongoose.set("useCreateIndex", true);
	return db;
}

async function getCollections () {
	const names = await db.db.listCollections().toArray();
	return names;
}
