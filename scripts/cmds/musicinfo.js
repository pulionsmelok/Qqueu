const axios = require("axios");

module.exports = {
  config: {
    name: "musicinfo",
    aliases: ["songinfo"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Search songs and get music information from iTunes."
        },
        category: "study",
        guide: {
            en: "{pn} <song name>",
            bn: "{pn} <song নাম>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" },
        bn: { syntaxError: "দয়া করে সঠিক সিনট্যাক্স ব্যবহার করুন: {pn}!" }
    },
  onStart: async function ({ message, args }) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply(
        "❌ Please enter a song name.\n\nExample:\n/musicinfo Believer"
      );
    }
    try {
      const response = await axios.get(
        "https://itunes.apple.com/search",
        {
          params: {
            term: query,
            media: "music",
            entity: "song",
            limit: 1,
            country: "US"
          }}
      );
      const data = response.data;
      if (!data?.results?.length) {
        return message.reply("❌ Music not found.");
      }
      const song = data.results[0];
      const name = song.trackName || "Unknown";
      const artist = song.artistName || "Unknown";
      const album = song.collectionName || "Unknown";
      const releaseDate = song.releaseDate
        ? new Date(song.releaseDate).toLocaleDateString()
        : "Unknown";
      const price =
        song.trackPrice !== undefined
          ? `${song.trackPrice} ${song.currency || ""}`.trim()
          : "Unknown";
      const length = song.trackTimeMillis
        ? formatDuration(song.trackTimeMillis)
        : "Unknown";
      const genre = song.primaryGenreName || "Unknown";
      let image = song.artworkUrl100 || null;
      if (image) {
        image = image.replace(
          /100x100bb\.(jpg|png)/i,
          "600x600bb.$1"
        );
      }
      const body =
        "┌───────────⭓\n" +
        "│ 𝐌𝐔𝐒𝐈𝐂 𝐈𝐍𝐅𝐎\n" +
        "├───────────\n" +
        `│ 🎵 𝐍𝐚𝐦𝐞: ${name}\n` +
        `│ 👤 𝐀𝐫𝐭𝐢𝐬𝐭: ${artist}\n` +
        `│ 💿 𝐀𝐥𝐛𝐮𝐦: ${album}\n` +
        `│ 📅 𝐑𝐞𝐥𝐞𝐚𝐬𝐞: ${releaseDate}\n` +
        `│ 💰 𝐏𝐫𝐢𝐜𝐞: ${price}\n` +
        `│ ⏱️ 𝐋𝐞𝐧𝐠𝐭𝐡: ${length}\n` +
        `│ 🎼 𝐆𝐞𝐧𝐫𝐞: ${genre}\n` +
        "└───────────⭓";
      const form = {
        body
      };
      if (image && global.utils?.getStreamFromURL) {
        try {
          form.attachment =
            await global.utils.getStreamFromURL(image);
        } catch (error) {
          console.error("Artwork error:", error);
        }
      }
      return message.reply(form);
    } catch (error) {
      console.error("MusicInfo error:", error);
      return message.reply(
        "❌ An error occurred while searching for the music."
      );
    }
  }
};

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
