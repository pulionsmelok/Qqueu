const fs = require("fs-extra");

module.exports = {
	config: {
    name: "backupdata",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Sao lưu dữ liệu của bot (threads, users, dashboard, globalData)",
            en: "Backup data of bot (threads, users, dashboard, globalData)",
            bn: "Backup data এর bot (threads, ব্যবহারকারীরা, dashboard, globalData)"
        },
        category: "owner",
        guide: {
            en: "   {pn}",
            bn: "   {pn}"
        }
},
	langs: {
		vi: {
			backedUp: "Đã sao lưu dữ liệu của bot vào thư mục scripts/cmds/tmp"
		},
		en: {
			backedUp: "Bot data has been backed up to the scripts/cmds/tmp folder"
		},
		bn: {
			backedUp: "Bot data has been backed up এ the scripts/cmds/tmp ফোল্ডার"
		}
	},
	onStart: async function ({ message, getLang, threadsData, usersData, dashBoardData, globalData }) {
		const [globalDataBackup, threadsDataBackup, usersDataBackup, dashBoardDataBackup] = await Promise.all([
			globalData.getAll(),
			threadsData.getAll(),
			usersData.getAll(),
			dashBoardData.getAll()
		]);
		const pathThreads = `${__dirname}/tmp/threadsData.json`;
		const pathUsers = `${__dirname}/tmp/usersData.json`;
		const pathDashBoard = `${__dirname}/tmp/dashBoardData.json`;
		const pathGlobal = `${__dirname}/tmp/globalData.json`;
		fs.writeFileSync(pathThreads, JSON.stringify(threadsDataBackup, null, 2));
		fs.writeFileSync(pathUsers, JSON.stringify(usersDataBackup, null, 2));
		fs.writeFileSync(pathDashBoard, JSON.stringify(dashBoardDataBackup, null, 2));
		fs.writeFileSync(pathGlobal, JSON.stringify(globalDataBackup, null, 2));
		message.reply({
			body: getLang("backedUp"),
			attachment: [
				fs.createReadStream(pathThreads),
				fs.createReadStream(pathUsers),
				fs.createReadStream(pathDashBoard),
				fs.createReadStream(pathGlobal)
			]
		});
	}
};
