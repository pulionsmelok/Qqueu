const { db, utils, GoatBot } = global;
const { config } = GoatBot;
const { log, getText } = utils;
const { creatingThreadData, creatingUserData } = global.client.database;

module.exports = async function (usersData, threadsData, event) {
	const { threadID } = event;
	const senderID = event.senderID || event.author || event.userID;
	const threadTask = (async () => {
		if (!threadID || global.temp.createThreadDataError.includes(threadID))
			return;
		try {
			const creating = creatingThreadData.find(t => t.threadID == threadID);
			if (creating) return await creating.promise;
			if (global.db.allThreadData.some(t => t.threadID == threadID))
				return;
			const threadData = await threadsData.create(threadID);
			log.info("DATABASE", `New Thread: ${threadID} | ${threadData.threadName} | ${config.database.type}`);
		} catch (err) {
			const description = String(err?.response?.description || err?.message || "");
			const isKicked403 = Number(err?.response?.error_code || err?.code) === 403
				&& /bot was kicked|bot was removed|chat not found/i.test(description);
			if (isKicked403) return;
			if (err.name != "DATA_ALREADY_EXISTS") {
				if (!global.temp.createThreadDataError.includes(threadID))
					global.temp.createThreadDataError.push(threadID);
				log.err("DATABASE", getText("handlerCheckData", "cantCreateThread", threadID), err);
			}
		}
	})();
	const userTask = (async () => {
		if (!senderID) return;
		try {
			const creating = creatingUserData.find(u => u.userID == senderID);
			if (creating) return await creating.promise;
			if (db.allUserData.some(u => u.userID == senderID))
				return;
			const userData = await usersData.create(senderID);
			log.info("DATABASE", `New User: ${senderID} | ${userData.name} | ${config.database.type}`);
		} catch (err) {
			if (err.name != "DATA_ALREADY_EXISTS")
				log.err("DATABASE", getText("handlerCheckData", "cantCreateUser", senderID), err);
		}
	})();
	await Promise.allSettled([threadTask, userTask]);
};
