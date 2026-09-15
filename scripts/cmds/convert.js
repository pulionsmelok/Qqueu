const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "convert",
    aliases: [],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Download media from a direct link"
        },
        category: "media",
        guide: {
            en: "{pn} <link>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, event, args, chatId, message }) {
    const url = args[0];
    const replyId = event?.messageID || event?.raw?.message_id || event?.message?.message_id;
    if (!url) {
      return message.reply("❌ Please provide a valid media link.\n\nExample:\n/convert https://i.imgur.com/5dx0x0Y.jpeg");
    }
    let parsed;
    try {
      parsed = new URL(url);
      if (!/^https?:$/i.test(parsed.protocol)) throw new Error("Invalid protocol");
    } catch {
      return message.reply("❌ Please provide a valid /https link.");
    }
    let extension = path.extname(parsed.pathname).toLowerCase();
    const validExtensions = [".jpeg", ".jpg", ".png", ".mp4", ".mp3", ".pdf", ".raw", ".docx", ".txt", ".gif", ".wav"];
    if (extension && !validExtensions.includes(extension)) {
      return message.reply("❌ Unsupported file format.\n\nSupported: jpeg, jpg, png, mp4, mp3, pdf, raw, docx, txt, gif, wav.");
    }
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          "Accept": "*/*"
        },
        validateStatus: status => status >= 200 && status < 300
      });
      const contentType = String(response.headers["content-type"] || "").split(";")[0].toLowerCase();
      if (!extension) {
        const typeMap = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "video/mp4": ".mp4",
          "audio/mpeg": ".mp3",
          "audio/wav": ".wav",
          "application/pdf": ".pdf",
          "text/plain": ".txt"
        };
        extension = typeMap[contentType] || ".bin";
      }
      const fileBuffer = Buffer.from(response.data);
      const opts = replyId ? { reply_to_message_id: Number(replyId) } : {};
      if (extension === ".jpg" || extension === ".jpeg" || extension === ".png") {
        await api.sendPhoto(chatId || event.threadID, fileBuffer, opts);
      } else if (extension === ".mp4") {
        await api.sendVideo(chatId || event.threadID, fileBuffer, opts);
      } else if (extension === ".mp3" || extension === ".wav") {
        await api.sendAudio(chatId || event.threadID, fileBuffer, opts);
      } else {
        await api.sendDocument(chatId || event.threadID, fileBuffer, opts);
      }
    } catch (error) {
      console.error("Convert command error:", error.response?.status || "", error.message || error);
      return message.reply("❌ Failed to download the media. Make sure the link is a direct, publicly accessible file link.");
    } finally {
      if (filePath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {
            console.error("Convert cleanup error:", e.message);
          }
        }, 5000);
      }
    }
  }
};
