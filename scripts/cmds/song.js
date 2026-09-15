const nayan = require("nayan-media-downloaders");
const Youtube = require("youtube-search-api");

module.exports = {
  config: {
    name: "song",
        aliases: ["sing", "music"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Search and download song from YouTube"
        },
        category: "media",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ event, api, message, args }) {
    const chatId = event.chat.id;
    const keyword = args.join(" ").trim();
    let waitMsg = null;
    if (!keyword) {
      return message.reply(
        "⚠️ Please provide a song name.\n\n" +
        "Example:\n" +
        "/song Believer"
      );
    }
    try {
      const results = await Youtube.GetListByKeyword(keyword, false, 1);
      const video = results?.items?.[0];
      if (!video || !video.id) {
        throw new Error("No song found on YouTube.");
      }
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      waitMsg = await message.reply("⏳ Downloading...");
      const data = await nayan.ytdown(videoUrl);
      const audioUrl = data?.data?.audio;
      const title = data?.data?.title || video.title;
      if (!audioUrl) throw new Error("No audio");
      await api.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
      await api.sendAudio(chatId, audioUrl, {
        caption: `🎧 ${title}`,
        reply_to_message_id: event.message_id
      });
    } catch (err) {
      console.log("ERROR:", err);
      await message.reply("❌ | Download failed");
    }
  }
};
