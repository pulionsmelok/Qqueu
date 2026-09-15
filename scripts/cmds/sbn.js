const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sbn",
        aliases: ["sbn", "banglasay"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Command description"
        },
        category: "media",
        guide: {
            en: "{pn} <text>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ message, args, event }) {
    try {
      let text = args.join(" ").trim();
      if (!text && event.reply_to_message) {
        text =
          event.reply_to_message.text ||
          event.reply_to_message.caption ||
          "";
      }
      if (!text) {
        return message.reply(
          "❌ Please enter a Bangla message.\n\nExample:\n/x আমি তোমাকে ভালোবাসি ❤️"
        );
      }
      if (text.length > 200) {
        return message.reply(
          "❌ Message too long!\nPlease keep it under 200 characters."
        );
      }
      const url =
        "https://translate.google.com/translate_tts" +
        "?ie=UTF-8" +
        "&tl=bn" +
        "&client=tw-ob" +
        `&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0 (Android 13; Mobile)"
        }
      });
      if (!response.data || !response.data.length) {
        throw new Error("Empty audio response");
      }
      const fsS = require("fs");
      const pathS = require("path");
      const cacheS = pathS.join(__dirname, "cache");
      if (!fsS.existsSync(cacheS)) fsS.mkdirSync(cacheS, { recursive: true });
      const tmpS = pathS.join(cacheS, `sbn_${Date.now()}.mp3`);
      fsS.writeFileSync(tmpS, Buffer.from(response.data));
      await message.reply({
        body: `🔊 ${text}`,
        attachment: fsS.createReadStream(tmpS)
      });
      setTimeout(() => { try { fsS.unlinkSync(tmpS); } catch(e){} }, 15000);
    } catch (error) {
      console.error(
        "❌ Bangla TTS Error:",
        error.response?.data ||
        error.message ||
        error
      );
      return message.reply(
        "❌ Failed to generate the voice.\nPlease try again later."
      );
    }
  }
};
