module.exports = {
	config: {
    name: "tid",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            vi: "Xem id nhóm chat của bạn",
            en: "View threadID of your group chat"
        },
        category: "info",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        vi: { syntaxError: "Vui lòng sử dụng đúng cú pháp {pn}!" },
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
	onStart: async function ({ message, event }) {
		message.reply(event.threadID.toString());
	}
};
