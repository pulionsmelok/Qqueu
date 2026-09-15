module.exports = {
	config: {
        name: "groupRemoveNotify",
        version: "2.1-TELEGRAM",
        author: "SK-SIDDIK-KHAN",
        usePrefix: true,
        category: "events",
    },
	onStart: async function ({ event, api, usersData, threadsData }) {
		if (event.logMessageType !== "log:unsubscribe") return;
		return async function () {
			try {
				const leftId = String(event.logMessageData?.leftParticipantFbId || event.left_chat_member?.id || "");
				if (!leftId) return;
				let botId = "";
				try {
					botId = String(api.getCurrentUserID?.() || (await api.getMe?.())?.id || global.GoatBot?.botID || "");
				} catch {}
				if (!botId || leftId !== botId) return;
				const moment = require("moment-timezone");
				const cfg = global.GoatBot?.config || global.config || {};
				const now = moment()
					.tz(cfg.timeZone || cfg.timezone || cfg.botInfo?.timezone || "Asia/Dhaka")
					.format("DD MMM YYYY | hh:mm:ss A");
				const botName = cfg.botInfo?.name || cfg.nickNameBot || cfg.botName || "SK-SIDDIK";
				const chatId = String(event.threadID);
				let chatTitle = event.chat?.title || event.raw?.chat?.title || "Unknown Group";
				try {
					const td = await threadsData.get(chatId);
					if (td?.threadName) chatTitle = td.threadName;
				} catch {}
				const removedById = String(event.author || event.from?.id || "Unknown");
				let removedBy = event.from?.first_name || null;
				if (!removedBy && removedById !== "Unknown") {
					try { removedBy = await usersData.getName(removedById); } catch {}
				}
				removedBy = removedBy || "Unknown";
				const safeTitle = String(chatTitle).replace(/[\u0000-\u001F\u007F]/g, "").trim();
				const displayTitle = safeTitle.length > 20 ? safeTitle.slice(0, 20) + "…" : safeTitle;
				const msg =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 🚨 REMOVED FROM GROUP!
├──────────────────────┤
│ 📂 Group: ${displayTitle}
│ 🆔 ID: ${chatId}
│ 👤 By: ${removedBy}
│ 🆔 UID: ${removedById}
│ ⏰ Time: ${now}
├──────────────────────┤
│ ⚠️ Bot was removed
│ from the group!
├──────────────────────┤
│ 👑 DEV: SK SIDDIK
╰─❖─〔 SIDDIK-TG-BOT 〕─❖─╯`;
				const admins = (cfg.adminBot || cfg.adminUID || cfg.ownerInfo?.botAdmins || []).map(String);
				for (const adminId of admins) {
					try {
						await api.sendMessage(msg, adminId, {
							reply_markup: {
								inline_keyboard: [
									[{ text: "👑 Contact Owner", url: "https://t.me/busy1here" }]
								]
							}
						});
					} catch {}
				}
			} catch (e) {
				console.log("groupRemoveNotify error:", e.message);
			}
		};
	}
};
