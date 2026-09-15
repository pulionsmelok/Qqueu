module.exports = async function (uriConnect) {
	uriConnect = uriConnect || process.env.MONGODB_URI;

	if (!uriConnect || uriConnect === "your_mongodb-uri" || uriConnect === "YOUR_MONGODB_URI" || uriConnect.trim() === "") {
		throw new Error("MongoDB URI is not configured. Put your MongoDB connection string in config.json → database.uriMongodb");
	}

	const mongoose = require("mongoose");
	const threadModel = require("../models/mongodb/thread.js");
	const userModel = require("../models/mongodb/user.js");
	const dashBoardModel = require("../models/mongodb/userDashBoard.js");
	const globalModel = require("../models/mongodb/global.js");

	await mongoose.connect(uriConnect);

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel
	};
};
