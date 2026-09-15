const fs = require("fs-extra");

module.exports = {
	config: {
    name: "loadconfig",
        aliases: ["loadcf"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            vi: "Load lại config của bot",
            en: "Reload config of bot",
            bn: "Reload config এর bot"
        },
        category: "owner",
        guide: {
            en: "{pn}"
        }
},
	langs: {
		vi: {
			success: "Config đã được load lại thành công"
		},
		en: {
			success: "Config has been reloaded successfully"
		},
		bn: {
			success: "Config has been reloaded সফলভাবে"
		}
	},
	onStart: async function ({ message, getLang }) {
		global.GoatBot.config = fs.readJsonSync(global.client.dirConfig);
		global.GoatBot.configCommands = fs.readJsonSync(global.client.dirConfigCommands);
		message.reply(getLang("success"));
	}
};
