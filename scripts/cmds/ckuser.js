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
    name: "ckuser",
        aliases: ["userck", "alluser"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 1,
        usePrefix: true,
    description: {
            en: "User & Group count (JSON / memory)"
        },
        category: "admin",
        guide: {
            en: "{pn}\n{pn} list\n{pn} gclist"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
	onStart: async function ({ event, args, message }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			const allUsers = Array.isArray(global.db?.allUserData) ? global.db.allUserData : [];
			const allThreads = Array.isArray(global.db?.allThreadData) ? global.db.allThreadData : [];
			const groups = allThreads.filter(t => {
				const id = String(t.threadID || t.id || "");
				return t.isGroup === true || id.startsWith("-");
			});
			const privates = allThreads.filter(t => {
				const id = String(t.threadID || t.id || "");
				return !(t.isGroup === true || id.startsWith("-"));
			});
			const banned = allUsers.filter(u => u?.banned?.status === true);
			const warnData = await readJSON("warnings.json", {});
			let warnUsers = 0;
			for (const tid of Object.keys(warnData)) warnUsers += Object.keys(warnData[tid] || {}).length;
			const sub = (args[0] || "").toLowerCase();
			if (sub === "list") {
				if (!allUsers.length) return message.reply("❌ কোনো ইউজার ডাটা নেই।");
				let txt = `👥 ALL USERS (${allUsers.length})\n━━━━━━━━━━━━━━━━━━━━\n`;
				allUsers.slice(0, 80).forEach((u, i) => {
					const name = u.name || u.firstName || "Unknown";
					const id = u.userID || u.id || "?";
					const ban = u?.banned?.status ? "🚫" : "✅";
					txt += `${i + 1}. ${ban} ${name}\nID: ${id}\n`;
				});
				if (allUsers.length > 80) txt += `\n...আরো ${allUsers.length - 80} জন\n`;
				return message.reply(txt);
			}
			if (sub === "gclist" || sub === "gc") {
				if (!groups.length) return message.reply("❌ কোনো গ্রুপ ডাটা নেই।");
				let txt = `📂 GROUPS (${groups.length})\n━━━━━━━━━━━━━━━━━━━━\n`;
				groups.slice(0, 50).forEach((g, i) => {
					txt += `${i + 1}. ${g.threadName || g.name || "Unknown"}\nID: ${g.threadID || g.id || "?"}\n`;
				});
				return message.reply(txt);
			}
			const p = global.utils?.getPrefix?.(chatId) || "/";
			return message.reply(
`📊 BOT STATS (JSON/Memory)
━━━━━━━━━━━━━━━━━━━━
👤 Users: ${allUsers.length}
📂 Groups: ${groups.length}
💬 Private: ${privates.length}
🚫 Banned: ${banned.length}
⚠️ Warn tracked: ${warnUsers}
━━━━━━━━━━━━━━━━━━━━
• ${p}ckuser list
• ${p}ckuser gclist`
			);
		} catch (e) {
			return message.reply("❌ Error: " + e.message);
		}
	}
};
