const fs = require("fs");
const path = require("path");
const axios = require("axios");
const nayan = require("nayan-media-downloaders");
const Youtube = require("youtube-search-api");

module.exports = {
  config: {
    name: "video",
        aliases: ["videos", "yt"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Direct video download"
        },
        category: "media",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, event, args }) {
    const chatId = event.threadID;
    const keyword = args.join(" ");
    if (!keyword) {
      return api.sendMessage(
        "⚠️ | Example: /video Believer",
        chatId,
        { reply_to_message_id: event.messageID }
      );
    }
    let filePath = null;
    try {
      const results = await Youtube.GetListByKeyword(keyword, false, 1);
      const video = results.items?.[0];
      if (!video) {
        return api.sendMessage("❌ | Video not found", chatId);
      }
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const wait = await api.sendMessage(
        "⏳ | Downloading video...",
        chatId,
        { reply_to_message_id: event.messageID }
      );
      const data = await nayan.ytdown(videoUrl);
      const videoLink = data?.data?.video;
      const title = data?.data?.title || video.title || "Downloaded Video";
      if (!videoLink) throw new Error("No video");
      if (wait?.messageID) {
        await api.deleteMessage(chatId, wait.messageID).catch(() => {});
      }
      if (`🎬 ${title}`.length <= 1024) {
        await api.sendVideo(chatId, videoLink, {
          caption: `🎬 ${title}`
        });
      } else {
        await api.sendVideo(chatId, videoLink);
        await api.sendMessage(
          `🎬 ${title}`,
          chatId,
          { reply_to_message_id: event.messageID }
        );
      }
    } catch (err) {
      console.log("ERROR:", err);
      await api.sendMessage(
        "❌ | Download failed",
        chatId,
        { reply_to_message_id: event.messageID }
      ).catch(() => {});
    } finally {
      if (filePath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch {}
        }, 15000);
      }
    }
  }
};
