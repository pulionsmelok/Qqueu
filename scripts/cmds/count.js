const fs = require("fs-extra");
const path = require("path");
const JSON_DIR = path.join(__dirname, "Siddik");

async function readJSON(name, fallback = {}) {
	try {
		await fs.ensureDir(JSON_DIR);
		const p = path.join(JSON_DIR, name.endsWith(".json") ? name : name + ".json");
		await fs.ensureFile(p);
		const raw = await fs.readFile(p, "utf8");
		if (!raw.trim()) return fallback;
		return JSON.parse(raw);
	} catch { return fallback; }
}

async function writeJSON(name, data) {
	await fs.ensureDir(JSON_DIR);
	const p = path.join(JSON_DIR, name.endsWith(".json") ? name : name + ".json");
	await fs.writeJson(p, data, { spaces: 2 });
	return data;
}

module.exports = {
	config: {
    name: "count",
        aliases: ["msgcount", "messages"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Message count (JSON)"
        },
        category: "info",
        guide: {
            en: "{pn}\n{pn} all"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
	onStart: async function ({ event, args, message, usersData }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			const userId = String(event.senderID || event.from?.id || "");
			const isGroup = event.isGroup === true || ["group", "supergroup"].includes(event.chat?.type) || chatId.startsWith("-");
			const store = await readJSON("msgcount.json", {});
			if (!store[chatId]) store[chatId] = { totalMessages: 0, userMessages: {} };
			const stats = store[chatId];
			const userMessages = stats.userMessages || {};
			if ((args[0] || "").toLowerCase() === "all") {
				if (!isGroup) return message.reply("❌ Leaderboard only in groups.");
				const entries = Object.entries(userMessages).sort((a, b) => b[1] - a[1]).slice(0, 20);
				if (!entries.length) return message.reply("📊 No message data yet.");
				let leaderboard = `📊 Top Message Senders\n📍 ${event.chat?.title || "Group"}\n💬 Total: ${stats.totalMessages || 0}\n\n`;
				for (let i = 0; i < entries.length; i++) {
					const [uid, count] = entries[i];
					let name = `User ${uid}`;
					try { name = (await usersData.getName(uid)) || name; } catch {}
					const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
					leaderboard += `${medal} ${name}\n   💬 ${count} messages\n\n`;
				}
				return message.reply(leaderboard);
			}
			return message.reply(`📊 Your count\n💬 This chat: ${userMessages[userId] || 0}\n📈 Total: ${stats.totalMessages || 0}`);
		} catch (e) {
			return message.reply("❌ Error: " + e.message);
		}
	},
	onChat: async function ({ event }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			const userId = String(event.senderID || event.from?.id || "");
			if (!chatId || !userId) return;
			const store = await readJSON("msgcount.json", {});
			if (!store[chatId]) store[chatId] = { totalMessages: 0, userMessages: {} };
			store[chatId].totalMessages = (store[chatId].totalMessages || 0) + 1;
			store[chatId].userMessages[userId] = (store[chatId].userMessages[userId] || 0) + 1;
			await writeJSON("msgcount.json", store);
		} catch {}
	}
};
