const axios = require("axios");

module.exports = {
  config: {
    name: "movieinfo",
    aliases: ["movie", "imdb"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 10,
    role: 0,
    
    
    
    
    usePrefix: true,
    description: {
            en: "Search and get movie information."
        },
        category: "media",
        guide: {
            en: "{pn} <movie name>",
            bn: "{pn} <movie নাম>"
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
        "❌ Please write a movie name...\n\nExample:\n/movieinfo kgf"
      );
    }
    try {
      const res = await axios.get(
        `https://www.omdbapi.com/?apikey=564727fa&t=${encodeURIComponent(query)}`
      );
      const data = res.data;
      if (!data || data.Response === "False") {
        return message.reply("❌ Movie not found.");
      }
      const title = data.Title || "Unknown";
      const year = data.Year || "Unknown";
      const runtime = data.Runtime || "Unknown";
      const genre = data.Genre || "Unknown";
      const director = data.Director || "Unknown";
      const actors = data.Actors || "Unknown";
      const rating = data.imdbRating || "N/A";
      const language = data.Language || "Unknown";
      const country = data.Country || "Unknown";
      const plot = data.Plot || "No plot available.";
      const poster = data.Poster;
      const body =
        "┌───────────⭓\n" +
        "│ 𝐌𝐎𝐕𝐈𝐄 𝐈𝐍𝐅𝐎\n" +
        "├───────────\n" +
        `│ 🎬 𝐓𝐢𝐭𝐥𝐞: ${title}\n` +
        `│ 📅 𝐑𝐞𝐥𝐞𝐚𝐬𝐞: ${year}\n` +
        `│ ⏱️ 𝐑𝐮𝐧𝐭𝐢𝐦𝐞: ${runtime}\n` +
        `│ 🎭 𝐆𝐞𝐧𝐫𝐞: ${genre}\n` +
        `│ 🎥 𝐃𝐢𝐫𝐞𝐜𝐭𝐨𝐫: ${director}\n` +
        `│ 👥 𝐀𝐜𝐭𝐨𝐫𝐬: ${actors}\n` +
        `│ ⭐ 𝐈𝐌𝐃𝐁: ${rating}\n` +
        `│ 🗣️ 𝐋𝐚𝐧𝐠𝐮𝐚𝐠𝐞: ${language}\n` +
        `│ 🌍 𝐂𝐨𝐮𝐧𝐭𝐫𝐲: ${country}\n` +
        "├───────────\n" +
        `│ 📝 𝐏𝐥𝐨𝐭:\n│ ${plot}\n` +
        "└───────────⭓";
      const form = {
        body
      };
      if (
        poster &&
        poster !== "N/A" &&
        global.utils?.getStreamFromURL
      ) {
        try {
          form.attachment =
            await global.utils.getStreamFromURL(poster);
        } catch (error) {
          console.error("Poster error:", error);
        }
      }
      return message.reply(form);
    } catch (error) {
      console.error("MovieInfo error:", error);
      return message.reply(
        "❌ An error occurred while searching for the movie."
      );
    }
  }
};
