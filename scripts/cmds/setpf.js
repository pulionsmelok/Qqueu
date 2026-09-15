const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "setpf",
        aliases: ["setprefix", "newpf", "changeprefix"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            en: "Command description"
        },
        category: "config",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({
    bot,
    event,
    args,
    message
  }) {
    const userId = String(event.senderID);
    const admins = (
      global.GoatBot.config.adminBot || []
    ).map(String);
    if (!admins.includes(userId)) {
      return message.reply(
        "━━━━━━━━━━━━━━━━\n" +
        "⚠️ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐀𝐝𝐦𝐢𝐧 𝐜𝐚𝐧 𝐜𝐡𝐚𝐧𝐠𝐞 𝐭𝐡𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱\n" +
        "━━━━━━━━━━━━━━━━"
      );
    }
    if (!args[0]) {
      return message.reply(
        `❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐧𝐞𝐰 𝐩𝐫𝐞𝐟𝐢𝐱.\n\n` +
        `Example: ${global.GoatBot.config.prefix}setpf !`
      );
    }
    const newPrefix = args[0];
    if (newPrefix.length > 10) {
      return message.reply(
        "❌ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐦𝐮𝐬𝐭 𝐛𝐞 𝟏𝟎 𝐜𝐡𝐚𝐫𝐚𝐜𝐭𝐞𝐫𝐬 𝐨𝐫 𝐥𝐞𝐬𝐬."
      );
    }
    const confirmMessage =
      "━━━━━━━━━━━━━━━━\n" +
      "🔄 𝐂𝐡𝐚𝐧𝐠𝐞 𝐒𝐲𝐬𝐭𝐞𝐦 𝐏𝐫𝐞𝐟𝐢𝐱\n\n" +
      `📌 𝐎𝐥𝐝 𝐏𝐫𝐞𝐟𝐢𝐱: ${global.GoatBot.config.prefix}\n` +
      `📌 𝐍𝐞𝐰 𝐏𝐫𝐞𝐟𝐢𝐱: ${newPrefix}\n\n` +
      "⚠️ 𝐂𝐥𝐢𝐜𝐤 𝐂𝐨𝐧𝐟𝐢𝐫𝐦 𝐭𝐨 𝐚𝐩𝐩𝐥𝐲 𝐭𝐡𝐞 𝐜𝐡𝐚𝐧𝐠𝐞.\n" +
      "━━━━━━━━━━━━━━━━";
    await bot.sendMessage(
      {
        body: confirmMessage,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Confirm",
                callback_data:
                  `setpf:confirm:${userId}:${encodeURIComponent(newPrefix)}`
              },
              {
                text: "❌ Cancel",
                callback_data:
                  `setpf:cancel:${userId}`
              }
            ]
          ]
        }
      },
      event.threadID
    );
  },
  onCallback: async function ({
    bot,
    event
  }) {
    const data = String(event.callbackData || event.data || "").trim();
    const parts = data.split(":");
    if (parts.length < 3 || parts[0].toLowerCase() !== "setpf") {
      return;
    }
    const action = parts[1];
    const userId = String(parts[2] || "");
    const senderId = String(event.senderID || event.userID || event.from?.id || "");
    const answer = async (text = "", showAlert = false) => {
      if (!event.callbackQueryID || !bot?.answerCallbackQuery) return;
      try {
        await bot.answerCallbackQuery(event.callbackQueryID, text, showAlert);
      } catch (err) {
        console.warn("SET PREFIX callback answer:", err.message || err);
      }
    };
    if (!senderId || senderId !== userId) {
      return answer("❌ You are not allowed to use this button.", true);
    }
    if (action === "cancel") {
      await answer("❌ Prefix change cancelled.");
      return bot.editMessageText(
        event.threadID,
        event.messageID,
        "━━━━━━━━━━━━━━━━\n" +
        "❌ 𝐏𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞 𝐜𝐚𝐧𝐜𝐞𝐥𝐥𝐞𝐝\n" +
        "━━━━━━━━━━━━━━━━"
      );
    }
    if (action !== "confirm") {
      return answer("❌ Invalid button action.", true);
    }
    let newPrefix = "";
    try {
      newPrefix = decodeURIComponent(parts.slice(3).join(":"));
    } catch (err) {
      return answer("❌ Invalid prefix.", true);
    }
    newPrefix = String(newPrefix || "").trim();
    if (!newPrefix || newPrefix.length > 10) {
      return answer(
        newPrefix ? "❌ Prefix must be 10 characters or less." : "❌ Invalid prefix.",
        true
      );
    }
    const configPath = global.client?.dirConfig || path.join(process.cwd(), "config.json");
    try {
      let configData;
      try {
        configData = fs.readJsonSync(configPath);
      } catch (readErr) {
        configData = { ...(global.GoatBot.config || {}) };
      }
      configData.prefix = newPrefix;
      fs.writeJsonSync(configPath, configData, { spaces: 2 });
      global.GoatBot.config.prefix = newPrefix;
      await answer(`✅ Prefix changed to ${newPrefix}`);
      return bot.editMessageText(
        event.threadID,
        event.messageID,
        "━━━━━━━━━━━━━━━━\n" +
        `✅ 𝐒𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐜𝐡𝐚𝐧𝐠𝐞𝐝 𝐭𝐨 : ${newPrefix}\n` +
        "━━━━━━━━━━━━━━━━"
      );
    } catch (err) {
      console.error("❌ SET PREFIX ERROR:", err);
      await answer("❌ Failed to change prefix.", true);
      return;
    }
  }
};
