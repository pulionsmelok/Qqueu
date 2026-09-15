module.exports = {
	config: {
    name: "unsend",
		aliases: ["un", "uns", "unsef"],
		version: "1.5.0",
		author: "SK-SIDDIK-KHAN",
		countDown: 5,
		role: 2,
		usePrefix: false,
    description: {
            vi: "Gỡ tin nhắn của bot hoặc tin nhắn của người dùng",
            en: "Unsend bot's message or user's message"
        },
        category: "box chat",
        guide: {
            vi: "reply tin nhắn muốn gỡ và gọi lệnh {pn}",
            en: "reply the message you want to unsend and call the command {pn}"
        }
},
	langs: {
		vi: {
			syntaxError: "Vui lòng reply tin nhắn bạn muốn gỡ!"
		},
		en: {
			syntaxError: "Please reply to the message you want to unsend!"
		}
	},
	onStart: async function ({ message, event, getLang }) {
		if (!event.messageReply)
			return message.reply(getLang("syntaxError"));
		
		return message.unsend(event.messageReply.messageID);
	}
};
