module.exports = {
	config: {
    name: "tginfo",
        aliases: ["forwardinfo", "fid"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 3,
        role: 0,
        usePrefix: true,
    description: {
            en: "Info from forwarded message",
            bn: "Info থেকে forwarded বার্তা"
        },
        category: "info",
        guide: {
            en: "Reply to a forwarded message with {pn}",
            bn: "Reply এ a forwarded বার্তা সহ {pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" },
        bn: { syntaxError: "দয়া করে সঠিক সিনট্যাক্স ব্যবহার করুন: {pn}!" }
    },
	onStart: async function ({ event, api, message }) {
		try {
			const chatId = String(event.threadID || event.chat?.id || "");
			const fwdMsg = event.messageReply || event.reply_to_message || event.message?.reply_to_message;
			const raw = event.raw?.reply_to_message || event.message?.reply_to_message || fwdMsg;
			if (!raw && !event.messageReply) {
				return message.reply("❌ একটা forwarded মেসেজে রিপ্লাই দিয়ে কমান্ড দাও।");
			}
			const msg = raw || {};
			const escapeHTML = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			if (msg.forward_from_chat || msg.forward_from_chat === null && msg.forward_origin?.type === "channel") {
				const chat = msg.forward_from_chat || {};
				const title = escapeHTML(chat.title || "N/A");
				const chatUser = chat.username ? "@" + escapeHTML(chat.username) : "Private";
				const boxed =
`╭───[ 📢 CHAT INFO ]───
│ Title: ${title}
│ Username: ${chatUser}
│ ID: ${chat.id || "N/A"}
│ Type: ${chat.type || "N/A"}
╰────────────────`;
				return message.reply(boxed);
			}
			if (msg.forward_from || event.messageReply?.senderID) {
				const user = msg.forward_from || {};
				const id = user.id || event.messageReply?.senderID;
				const name = escapeHTML(user.first_name || event.messageReply?.senderName || "User");
				const username = user.username ? "@" + escapeHTML(user.username) : "N/A";
				const boxed =
`╭───[ 👤 USER INFO ]───
│ Name: ${name}
│ Username: ${username}
│ ID: ${id}
╰────────────────`;
				try {
					if (id && api.getUserProfilePhotos) {
						const photos = await api.getUserProfilePhotos(id);
						if (photos?.total_count > 0) {
							const fileId = photos.photos[0].at(-1).file_id;
							return api.sendPhoto(chatId, fileId, { caption: boxed });
						}
					}
				} catch {}
				return message.reply(boxed);
			}
			if (msg.forward_sender_name) {
				return message.reply(`⚠️ তথ্য পাওয়া যায়নি — ${msg.forward_sender_name} forward privacy on`);
			}
			return message.reply("❌ Forwarded message detect হয়নি।");
		} catch (e) {
			return message.reply("❌ Error: " + e.message);
		}
	}
};
