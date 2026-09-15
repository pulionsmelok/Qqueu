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
    name: "warn",
        aliases: ["warning"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 1,
        usePrefix: true,
    description: {
            en: "Warn users (3 = ban+kick)",
            bn: "Warn ব্যবহারকারীরা (3 = ban+kick)"
        },
        category: "admin",
        guide: {
            en: "{pn} [reason] (reply)\n{pn} <uid> [reason]",
            bn: "{pn} [কারণ] (reply)\n{pn} <uid> [কারণ]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" },
        bn: { syntaxError: "দয়া করে সঠিক সিনট্যাক্স ব্যবহার করুন: {pn}!" }
    },
	onStart: async function ({ event, api, args, message, usersData }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			const isGroup = event.isGroup === true || ["group", "supergroup"].includes(event.chat?.type) || chatId.startsWith("-");
			if (!isGroup) return message.reply("❌ Only in groups");
			let targetId = null, targetName = "User", reason = "";
			if (event.messageReply?.senderID || event.reply_to_message?.from) {
				targetId = String(event.messageReply?.senderID || event.reply_to_message.from.id);
				targetName = event.messageReply?.senderName || event.reply_to_message?.from?.first_name || "User";
				reason = args.join(" ") || "No reason provided";
			} else if (args[0] && /^\d+$/.test(args[0])) {
				targetId = String(args[0]);
				reason = args.slice(1).join(" ") || "No reason provided";
				try { targetName = (await usersData.getName(targetId)) || "User"; } catch { targetName = "User"; }
			} else if (event.mentions && Object.keys(event.mentions).length) {
				targetId = Object.keys(event.mentions)[0];
				targetName = event.mentions[targetId] || "User";
				reason = args.join(" ") || "No reason provided";
			}
			if (!targetId) {
				const p = global.utils?.getPrefix?.(chatId) || "/";
				return message.reply(`❌ Usage:\n• ${p}warn [reason] (reply)\n• ${p}warn <uid> [reason]`);
			}
			const adminBot = (global.GoatBot?.config?.adminBot || []).map(String);
			if (adminBot.includes(String(targetId))) return message.reply("❌ Cannot warn bot admins");
			const store = await readJSON("warnings.json", {});
			if (!store[chatId]) store[chatId] = {};
			if (!Array.isArray(store[chatId][targetId])) store[chatId][targetId] = [];
			store[chatId][targetId].push({ reason, by: String(event.senderID || ""), at: new Date().toISOString() });
			await writeJSON("warnings.json", store);
			const warnCount = store[chatId][targetId].length;
			if (warnCount >= 3) {
				const time = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });
				try { await usersData.set(targetId, { banned: { status: true, reason: "3 warnings", date: time } }); } catch {}
				delete store[chatId][targetId];
				await writeJSON("warnings.json", store);
				try {
					await api.banChatMember(chatId, targetId);
					return message.reply(`⚠️ ${targetName} warned!\n📝 ${reason}\n⚠️ ${warnCount}/3\n❌ Banned & kicked`);
				} catch (err) {
					return message.reply(`⚠️ Banned in bot, kick failed: ${err.message}`);
				}
			}
			return message.reply(`⚠️ ${targetName} warned!\n📝 ${reason}\n⚠️ ${warnCount}/3`);
		} catch (e) {
			return message.reply("❌ Error: " + e.message);
		}
	}
};
