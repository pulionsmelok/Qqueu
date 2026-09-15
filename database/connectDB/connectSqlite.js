module.exports = async function () {
	const { Sequelize } = require("sequelize");
	const fs = require("fs-extra");
	const path = require("path");
	const { config } = global.GoatBot;

	let dbPath = (config.database && config.database.sqlitePath) 
		|| process.env.SQLITE_DB_PATH 
		|| path.join(__dirname, "..", "data", "data.sqlite");

	fs.mkdirpSync(path.dirname(dbPath));

	const sequelize = new Sequelize({
		dialect: "sqlite",
		storage: dbPath,
		logging: false
	});

	const threadModel = require("../models/sqlite/thread.js")(sequelize);
	const userModel = require("../models/sqlite/user.js")(sequelize);
	const dashBoardModel = require("../models/sqlite/userDashBoard.js")(sequelize);
	const globalModel = require("../models/sqlite/global.js")(sequelize);

	await sequelize.sync({ force: false });

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		sequelize
	};
};
