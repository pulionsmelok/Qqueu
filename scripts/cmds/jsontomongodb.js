const fs = require("fs-extra");

module.exports = {
	config: {
    name: "jsontomongodb",
        aliases: ["jsontomongo"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Đồng bộ dữ liệu từ json sang mongodb",
            en: "Synchronize data from json to mongodb",
            bn: "Synchronize data থেকে json এ mongodb"
        },
        category: "owner",
        guide: {
            vi: "   {pn} <thread | user | dashboard | global | all>: Sẽ đồng bộ dữ liệu từ data json được lưu trong thư mục database/data sang mongodb\n\n   Lưu ý: Nếu dữ liệu đã tồn tại trong mongodb thì sẽ được cập nhật lại",
            en: "   {pn} <thread | user | dashboard | global | all>: Will synchronize data from json data stored in the database/data folder to mongodb\n\n   Note: If the data already exists in mongodb, it will be updated",
            bn: "   {pn} <thread | ব্যবহারকারী | dashboard | global | all>: Will synchronize data থেকে json data stored in the database/data ফোল্ডার এ mongodb\n\n   নোট: If the data ইতোমধ্যে exists in mongodb, it will be updated"
        }
},
	langs: {
		vi: {
			invalidDatabase: "❌ Vui lòng chuyển database sang mongodb trong config sau đó khởi động lại bot để sử dụng lệnh này",
			missingFile: "❌ Bạn chưa sao chép dữ liệu file %1 vào thư mục database/data",
			formatInvalid: "❌ Định dạng dữ liệu không hợp lệ",
			error: "❌ Đã có lỗi xảy ra:\n%1: %2",
			successThread: "✅ Đã đồng bộ dữ liệu nhóm từ json sang mongodb thành công!",
			successUser: "✅ Đã đồng bộ dữ liệu người dùng từ json sang mongodb thành công!",
			successDashboard: "✅ Đã đồng bộ dữ liệu dashboard từ json sang mongodb thành công!",
			successGlobal: "✅ Đã đồng bộ dữ liệu global từ json sang mongodb thành công!"
		},
		en: {
			invalidDatabase: "❌ Please switch database to mongodb in config then restart the bot to use this command",
			missingFile: "❌ You haven't copied the data file %1 into the database/data folder",
			formatInvalid: "❌ Data format is invalid",
			error: "❌ An error occurred:\n%1: %2",
			successThread: "✅ Successfully synchronized thread data from json to mongodb!",
			successUser: "✅ Successfully synchronized user data from json to mongodb!",
			successDashboard: "✅ Successfully synchronized dashboard data from json to mongodb!",
			successGlobal: "✅ Successfully synchronized global data from json to mongodb!"
		},
		bn: {
			invalidDatabase: "❌ Please switch database এ mongodb in config then রিস্টার্ট the bot এ use this কমান্ড",
			missingFile: "❌ আপনার আছেn't copied the data ফাইল %1 into the database/data ফোল্ডার",
			formatInvalid: "❌ Data format is অবৈধ",
			error: "❌ একটি ত্রুটি ঘটেছে:\n%1: %2",
			successThread: "✅ Successfully synchronized thread data থেকে json এ mongodb!",
			successUser: "✅ Successfully synchronized ব্যবহারকারী data থেকে json এ mongodb!",
			successDashboard: "✅ Successfully synchronized dashboard data থেকে json এ mongodb!",
			successGlobal: "✅ Successfully synchronized global data থেকে json এ mongodb!"
		}
	},
	onStart: async function ({ args, message, threadModel, userModel, dashBoardModel, globalModel, getLang }) {
		if (global.GoatBot.config.database.type !== "mongodb")
			return message.reply(getLang("invalidDatabase"));
		switch (args[0]) {
			case "thread": {
				return syncThreadData(message, threadModel, getLang);
			}
			case "user": {
				return syncUserData(message, userModel, getLang);
			}
			case "dashboard": {
				return syncDashBoardData(message, dashBoardModel, getLang);
			}
			case "global": {
				return syncGlobalData(message, globalModel, getLang);
			}
			case "all": {
				await syncThreadData(message, threadModel, getLang);
				await syncUserData(message, userModel, getLang);
				await syncDashBoardData(message, dashBoardModel, getLang);
				await syncGlobalData(message, globalModel, getLang);
				return;
			}
			default:
				return message.SyntaxError();
		}
	}
};

async function syncThreadData(message, threadModel, getLang) {
	let oldThreadsData;
	const pathThreadData = `${process.cwd()}/database/data/threadsData.json`;
	if (!fs.existsSync(pathThreadData))
		return message.reply(getLang("missingFile", pathThreadData.split("/").pop()));
	try {
		oldThreadsData = require(pathThreadData);
		delete require.cache[require.resolve(pathThreadData)];
	}
	catch (err) {
		return message.reply(getLang("formatInvalid"));
	}
	try {
		const bulkOperations = [];
		for (const thread of oldThreadsData) {
			const threadIndex = global.db.allThreadData.findIndex(item => item.threadID == thread.threadID);
			if (threadIndex === -1) {
				bulkOperations.push({
					insertOne: {
						document: thread
					}
				});
			}
			else {
				bulkOperations.push({
					replaceOne: {
						filter: { threadID: thread.threadID },
						replacement: thread
					}
				});
			}
		}
		if (bulkOperations.length > 0) {
			await threadModel.bulkWrite(bulkOperations);
			global.db.allThreadData = await threadModel.find({}).lean();
		}
		return message.reply(getLang("successThread"));
	}
	catch (err) {
		return message.reply(getLang("error", err.name, err.message));
	}
}

async function syncUserData(message, userModel, getLang) {
	let oldUsersData;
	const pathUsersData = `${process.cwd()}/database/data/usersData.json`;
	if (!fs.existsSync(pathUsersData))
		return message.reply(getLang("missingFile", pathUsersData.split("/").pop()));
	try {
		oldUsersData = require(pathUsersData);
		delete require.cache[require.resolve(pathUsersData)];
	}
	catch (err) {
		return message.reply(getLang("formatInvalid"));
	}
	try {
		const bulkOperations = [];
		for (const user of oldUsersData) {
			const userIndex = global.db.allUserData.findIndex(item => item.userID == user.userID);
			if (userIndex === -1) {
				bulkOperations.push({
					insertOne: {
						document: user
					}
				});
			}
			else {
				bulkOperations.push({
					replaceOne: {
						filter: { userID: user.userID },
						replacement: user
					}
				});
			}
		}
		if (bulkOperations.length > 0) {
			await userModel.bulkWrite(bulkOperations);
			global.db.allUserData = await userModel.find({}).lean();
		}
		return message.reply(getLang("successUser"));
	}
	catch (err) {
		return message.reply(getLang("error", err.name, err.message));
	}
}

async function syncDashBoardData(message, dashBoardModel, getLang) {
	let oldDashBoardData;
	const pathDashBoardData = `${process.cwd()}/database/data/dashBoardData.json`;
	if (!fs.existsSync(pathDashBoardData))
		return message.reply(getLang("missingFile", pathDashBoardData.split("/").pop()));
	try {
		oldDashBoardData = require(pathDashBoardData);
		delete require.cache[require.resolve(pathDashBoardData)];
	}
	catch (err) {
		return message.reply(getLang("formatInvalid"));
	}
	try {
		const bulkOperations = [];
		for (const dashboard of oldDashBoardData) {
			const dashboardIndex = global.db.allDashBoardData.findIndex(item => item.email == dashboard.email);
			if (dashboardIndex === -1) {
				bulkOperations.push({
					insertOne: {
						document: dashboard
					}
				});
			}
			else {
				bulkOperations.push({
					replaceOne: {
						filter: { email: dashboard.email },
						replacement: dashboard
					}
				});
			}
		}
		if (bulkOperations.length > 0) {
			await dashBoardModel.bulkWrite(bulkOperations);
			global.db.allDashBoardData = await dashBoardModel.find({}).lean();
		}
		return message.reply(getLang("successDashboard"));
	}
	catch (err) {
		return message.reply(getLang("error", err.name, err.message));
	}
}

async function syncGlobalData(message, globalModel, getLang) {
	let oldGlobalData;
	const pathGlobalData = `${process.cwd()}/database/data/globalData.json`;
	if (!fs.existsSync(pathGlobalData))
		return message.reply(getLang("missingFile", pathGlobalData.split("/").pop()));
	try {
		oldGlobalData = require(pathGlobalData);
		delete require.cache[require.resolve(pathGlobalData)];
	}
	catch (err) {
		return message.reply(getLang("formatInvalid"));
	}
	try {
		const bulkOperations = [];
		for (const global_ of oldGlobalData) {
			const globalIndex = global.db.allGlobalData.findIndex(item => item.key == global_.key);
			if (globalIndex === -1) {
				bulkOperations.push({
					insertOne: {
						document: global_
					}
				});
			}
			else {
				bulkOperations.push({
					replaceOne: {
						filter: { key: global_.key },
						replacement: global_
					}
				});
			}
		}
		if (bulkOperations.length > 0) {
			await globalModel.bulkWrite(bulkOperations);
			global.db.allGlobalData = await globalModel.find({}).lean();
		}
		return message.reply(getLang("successGlobal"));
	}
	catch (err) {
		return message.reply(getLang("error", err.name, err.message));
	}
}
