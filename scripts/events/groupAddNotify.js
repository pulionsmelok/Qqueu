module.exports = {
	config: {
        name: "groupAddNotify",
        version: "4.1-TELEGRAM",
        author: "SK-SIDDIK-KHAN",
        usePrefix: true,
        category: "events",
    },
	onStart: async function ({ event, api, usersData }) {
		if (event.logMessageType !== "log:subscribe") return;
		return async function () {
			try {
				const added = event.logMessageData?.addedParticipants || [];
				if (!added.length) return;
				let botId = "";
				try {
					botId = String(api.getCurrentUserID?.() || (await api.getMe?.())?.id || global.GoatBot?.botID || "");
				} catch {}
				if (!botId || !added.some(m => String(m.userFbId) === botId)) return;
				const moment = require("moment-timezone");
				const cfg = global.GoatBot?.config || global.config || {};
				const now = moment()
					.tz(cfg.timeZone || cfg.timezone || cfg.botInfo?.timezone || "Asia/Dhaka")
					.format("DD MMM YYYY | hh:mm:ss A");
				const chatId = String(event.threadID);
				let title = event.chat?.title || event.raw?.chat?.title || "Unknown Group";
				let username = "N/A (private)";
				let count = "?";
				let inviteLink = null;
				try { count = await api.getChatMemberCount(chatId); } catch {}
				try {
					const c = await api.getChat(chatId);
					title = c.title || title;
					if (c.username) {
						username = "@" + c.username;
						inviteLink = "https://t.me/" + c.username;
					}
				} catch {}
				try {
					if (!inviteLink && api.createChatInviteLink) {
						const l = await api.createChatInviteLink(chatId);
						inviteLink = l.invite_link || l;
					}
				} catch {}
				const fromId = String(event.author || event.from?.id || "");
				let fromName = event.from
					? [event.from.first_name, event.from.last_name].filter(Boolean).join(" ")
					: null;
				if (!fromName && fromId) {
					try { fromName = await usersData.getName(fromId); } catch {}
				}
				fromName = fromName || "Unknown";
				const fromUname = event.from?.username ? "@" + event.from.username : "N/A";
				const botName = cfg.botInfo?.name || cfg.nickNameBot || cfg.botName || "SK-SIDDIK";
				const safeTitle = String(title).replace(/[\u0000-\u001F\u007F]/g, "").trim();
				const displayTitle = safeTitle.length > 18 ? safeTitle.slice(0, 18) + "…" : safeTitle;
				const safeFromName = String(fromName).replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 16);
				const msg =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 🎉 NEW GROUP ADDED!
├──────────────────────┤
│ 📂 Group: ${displayTitle}
│ 🆔 ID: ${chatId}
│ 👥 Member: ${count}
│ 💬 User: ${username}
├──────────────────────┤
│ 👤 Added By: ${safeFromName}
│ 📝 ${fromUname}
│ 🆔 ${fromId}
│ ⏰ ${now}
├──────────────────────┤
│ 👑 DEV: SK SIDDIK
╰─❖─〔 SIDDIK-TG-BOT 〕─❖─╯`;
				const buttons = [];
				if (inviteLink) buttons.push([{ text: "💬 Open Group", url: String(inviteLink) }]);
				buttons.push([{ text: "👑 Contact Owner", url: "https://t.me/busy1here" }]);
				const admins = (cfg.adminBot || cfg.adminUID || cfg.ownerInfo?.botAdmins || []).map(String);
				for (const adminId of admins) {
					try {
						await api.sendMessage(msg, adminId, {
							reply_markup: { inline_keyboard: buttons }
						});
					} catch {}
				}
			} catch (e) {
				console.log("groupAddNotify error:", e.message);
			}
		};
	}
};
