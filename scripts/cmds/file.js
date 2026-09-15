const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "filecmd",
    aliases: ["file"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 2,
    usePrefix: true,
    description: {
            en: "View the raw source code file of any command in the commands folder"
        },
        category: "owner",
        guide: {
            en: "{pn} <commandName>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ api, event, args }) {
    try {
      const threadID = event.threadID || event.chat?.id;
      const messageID = event.messageID || event.message_id;
      const cmdName = args[0];

      if (!cmdName) {
        return api.sendMessage(
          "❌ | Please provide the command name",
          threadID,
          () => {},
          messageID
        );
      }

      const cmdPath = path.join(__dirname, `${cmdName}.js`);

      if (!fs.existsSync(cmdPath)) {
        return api.sendMessage(
          `❌ | Command "${cmdName}" not found in this folder`,
          threadID,
          () => {},
          messageID
        );
      }

      const botInstance = api.telegram || api;

      if (typeof botInstance.sendDocument === "function") {
        await botInstance.sendDocument(
          threadID,
          fs.createReadStream(cmdPath),
          {},
          { reply_to_message_id: messageID }
        );
      } else if (typeof api.sendDocument === "function") {
        await api.sendDocument(
          threadID,
          cmdPath,
          {},
          messageID
        );
      } else {
        await api.sendMessage(
          {
            attachment: fs.createReadStream(cmdPath)
          },
          threadID,
          () => {},
          messageID
        );
      }

    } catch (err) {
      console.error("FileCmd Error:", err);
      api.sendMessage(
        `❌ | Error reading the file: ${err.message}`,
        event.threadID || event.chat?.id,
        event.messageID || event.message_id
      );
    }
  }
};