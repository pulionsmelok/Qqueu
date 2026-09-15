const { graphQlQueryToJson } = require("graphql-query-to-json");
const ora = require("ora");
const { log, getText } = global.utils;
const { config } = global.GoatBot;
const databaseType = (config.database.type || "json").toLowerCase().trim();

function fakeGraphql(query, data, obj = {}) {
	if (typeof query != "string" && typeof query != "object")
		throw new Error(`The "query" argument must be of type string or object, got ${typeof query}`);
	if (query == "{}" || !data)
		return data;
	if (typeof query == "string")
		query = graphQlQueryToJson(query).query;
	const keys = query ? Object.keys(query) : [];
	for (const key of keys) {
		if (typeof query[key] === 'object') {
			if (!Array.isArray(data[key]))
				obj[key] = data.hasOwnProperty(key) ? fakeGraphql(query[key], data[key] || {}, obj[key]) : null;
			else
				obj[key] = data.hasOwnProperty(key) ? data[key].map(item => fakeGraphql(query[key], item, {})) : null;
		}
		else
			obj[key] = data.hasOwnProperty(key) ? data[key] : null;
	}
	return obj;
}

module.exports = async function (api) {
	var threadModel, userModel, dashBoardModel, globalModel, sequelize = null;

	const supported = ["json", "sqlite", "mongodb"];
	if (!supported.includes(databaseType)) {
		log.err("DATABASE", `Unsupported database type: "${databaseType}". Supported: ${supported.join(", ")}`);
		process.exit(1);
	}

	switch (databaseType) {
		case "mongodb": {
			const spin = ora({
				text: getText('indexController', 'connectingMongoDB') || "Connecting to MongoDB...",
				spinner: {
					interval: 80,
					frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
				}
			});
			const defaultClearLine = process.stderr.clearLine;
			process.stderr.clearLine = function () { };
			spin.start();
			try {
				var { threadModel, userModel, dashBoardModel, globalModel } = await require("../connectDB/connectMongoDB.js")(config.database.uriMongodb);
				spin.stop();
				process.stderr.clearLine = defaultClearLine;
				log.info("MONGODB", getText("indexController", "connectMongoDBSuccess") || "Connected to MongoDB successfully");
			}
			catch (err) {
				spin.stop();
				process.stderr.clearLine = defaultClearLine;
				log.err("MONGODB", getText("indexController", "connectMongoDBError") || "Failed to connect MongoDB", err);
				process.exit(1);
			}
			break;
		}
		case "sqlite": {
			const spin = ora({
				text: "Connecting to SQLite...",
				spinner: {
					interval: 80,
					frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
				}
			});
			const defaultClearLine = process.stderr.clearLine;
			process.stderr.clearLine = function () { };
			spin.start();
			try {
				var { threadModel, userModel, dashBoardModel, globalModel, sequelize } = await require("../connectDB/connectSqlite.js")();
				process.stderr.clearLine = defaultClearLine;
				spin.stop();
				log.info("SQLITE", "Connected to SQLite successfully");
			}
			catch (err) {
				process.stderr.clearLine = defaultClearLine;
				spin.stop();
				log.err("SQLITE", "Failed to connect SQLite", err);
				process.exit(1);
			}
			break;
		}
		case "json": {
			log.info("JSON", "Using JSON file storage (usersData.json, threadsData.json, globalData.json, dashBoardData.json)");
			break;
		}
	}

	const threadsData = await require("./threadsData.js")(databaseType, threadModel, api, fakeGraphql);
	const usersData = await require("./usersData.js")(databaseType, userModel, api, fakeGraphql);
	const dashBoardData = await require("./dashBoardData.js")(databaseType, dashBoardModel, fakeGraphql);
	const globalData = await require("./globalData.js")(databaseType, globalModel, fakeGraphql);

	global.db = {
		...global.db,
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize
	};

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		threadsData,
		usersData,
		dashBoardData,
		globalData,
		sequelize,
		databaseType
	};
};
