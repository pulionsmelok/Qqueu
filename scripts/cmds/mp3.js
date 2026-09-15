const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "mp3",
    aliases: ["convertmp3", "cnvtmp3"],
    author: "SK-SIDDIK-KHAN",
    version: "1.5.0",
    role: 0,
    usePrefix: true,
    description: {
            en: "Download video from URL and convert to MP3."
        },
        category: "media",
        guide: {
            en: "{p}convertmp3 <video_url>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function({ api, args, event }) {
    const { threadID, messageID } = event;
    try {
      const url = args.join(" ") || event.messageReply?.attachments?.[0]?.url;
      if (!url)
        return api.sendMessage(
          "⚠️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠɪᴅᴇᴏ ᴜʀʟ!",
          threadID,
          messageID
        );
      const processing = await api.sendMessage(
        "Mᴘ3 ᴘʀᴏᴄᴇssɪɴɢ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ⏳",
        threadID
      );
      const { data } = await axios.get(url, {
        responseType: "arraybuffer"
      });
      if (processing && processing.messageID)
        await api.unsendMessage(processing.messageID);
      const fsM = require("fs");
      const pathM = require("path");
      const cacheM = pathM.join(__dirname, "cache");
      if (!fsM.existsSync(cacheM)) fsM.mkdirSync(cacheM, { recursive: true });
      const tmpM = pathM.join(cacheM, `mp3_${Date.now()}.mp3`);
      fsM.writeFileSync(tmpM, Buffer.from(data));
      return api.sendMessage(
        {
          body: "Mᴘ3 ʀᴇᴀᴅʏ ✅",
          attachment: fsM.createReadStream(tmpM)
        },
        threadID,
        messageID
      );
    } catch (err) {
      console.log(err);
      return api.sendMessage(
        "⚠️ Fᴀɪʟᴇᴅ ᴛᴏ ᴄᴏɴᴠᴇʀᴛ ᴠɪᴅᴇᴏ!",
        threadID,
        messageID
      );
    }
  }
};
