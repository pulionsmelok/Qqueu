module.exports = {
	config: {
    name: "gcinfo",
        aliases: ["groupinfo", "ginfo"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Group information"
        },
        category: "info",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
	onStart: async function ({ event, api, message, threadsData }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			if (!chatId.startsWith("-") && event.isGroup !== true && !["group", "supergroup"].includes(event.chat?.type)) {
				return message.reply("❌ Only in groups");
			}
			let title = event.chat?.title || "Group";
			let username = event.chat?.username ? "@" + event.chat.username : "N/A";
			let count = "?";
			let description = "N/A";
			try {
				const c = await api.getChat(chatId);
				title = c.title || title;
				username = c.username ? "@" + c.username : username;
				description = c.description || description;
			} catch {}
			try { count = await api.getChatMemberCount(chatId); } catch {}
			let admins = [];
			try {
				const list = await api.getChatAdministrators(chatId);
				admins = (list || []).slice(0, 15).map(a => {
					const n = [a.user?.first_name, a.user?.last_name].filter(Boolean).join(" ") || "Admin";
					return `• ${n} (${a.status})`;
				});
			} catch {}
			let threadName = title;
			try {
				const td = await threadsData.get(chatId);
				if (td?.threadName) threadName = td.threadName;
			} catch {}
			const txt =
`╭─❖─〔 GROUP INFO 〕─❖─╮
│ 📂 ${title}
│ 🆔 ${chatId}
│ 🔗 ${username}
│ 👥 Members: ${count}
│ 📝 ${String(description).slice(0, 120)}
├─ Admins ─┤
${admins.length ? admins.join("\n") : "│ N/A"}
╰─❖─╯`;
			try {
				const c = await api.getChat(chatId);
				if (c?.photo?.big_file_id) {
					return api.sendPhoto(chatId, c.photo.big_file_id, { caption: txt });
				}
			} catch {}
			return message.reply(txt);
		} catch (e) {
			return message.reply("❌ Error: " + e.message);
		}
	}
};
