const axios = require("axios");

module.exports = {
  config: {
    name: "ip",
    aliases: ["ipinfo", "iplookup"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Get public information about an IP address"
        },
        category: "boxchat",
        guide: {
            en: "{pn} <IP address>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ message, args }) {
    const ip = args.join(" ").trim();
    if (!ip) {
      return message.reply(
        "┌───────────⭓\n" +
        "│ 𝐈𝐏 𝐈𝐍𝐅𝐎\n" +
        "├───────────\n" +
        "│ ❌ 𝐄𝐧𝐭𝐞𝐫 𝐚𝐧 𝐈𝐏 𝐚𝐝𝐝𝐫𝐞𝐬𝐬!\n" +
        "│\n" +
        "│ 📌 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:\n" +
        "│ /ip 8.8.8.8\n" +
        "└───────────⭓"
      );
    }
    try {
      const response = await axios.get(
        `https://ipinfo.io/${encodeURIComponent(ip)}/json`,
        {
          timeout: 15000
        }
      );
      const data = response.data;
      if (!data || !data.ip) {
        return message.reply(
          "❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐈𝐏 𝐚𝐝𝐝𝐫𝐞𝐬𝐬 𝐨𝐫 𝐈𝐏 𝐝𝐚𝐭𝐚 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝."
        );
      }
      let asn = "Unknown";
      let asnName = "Unknown";
      if (data.as?.asn) {
        asn = data.as.asn;
        asnName = data.as.name || "Unknown";
      } else if (data.asn) {
        asn = data.asn;
        asnName = data.as_name || "Unknown";
      } else if (data.org) {
        const asnMatch = data.org.match(/AS\d+/i);
        if (asnMatch) {
          asn = asnMatch[0].toUpperCase();
          asnName = data.org
            .replace(/AS\d+\s*/i, "")
            .trim() || "Unknown";
        } else {
          asnName = data.org;
        }
      }
      const result =
        "┌───────────⭓\n" +
        "│ 𝐈𝐏 𝐈𝐍𝐅𝐎\n" +
        "├───────────\n" +
        `│ 🌐 𝐈𝐏: ${data.ip || "Unknown"}\n` +
        `│ 🌍 𝐂𝐨𝐮𝐧𝐭𝐫𝐲: ${data.country || "Unknown"}\n` +
        `│ 🏷️ 𝐑𝐞𝐠𝐢𝐨𝐧: ${data.region || "Unknown"}\n` +
        `│ 🏙️ 𝐂𝐢𝐭𝐲: ${data.city || "Unknown"}\n` +
        `│ 📮 𝐙𝐢𝐩: ${data.postal || "Unknown"}\n` +
        `│ ⏱️ 𝐓𝐢𝐦𝐞𝐳𝐨𝐧𝐞: ${data.timezone || "Unknown"}\n` +
        `│ 🏢 𝐎𝐫𝐠: ${data.org || "Unknown"}\n` +
        `│ 📍 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧: ${data.loc || "Unknown"}\n` +
        `│ 🔗 𝐇𝐨𝐬𝐭𝐧𝐚𝐦𝐞: ${data.hostname || "Unknown"}\n` +
        `│ 📡 𝐀𝐒𝐍: ${asn}\n` +
        `│ 🏛️ 𝐀𝐒𝐍 𝐍𝐚𝐦𝐞: ${asnName}\n` +
        "└───────────⭓";
      return message.reply(result);
    } catch (error) {
      console.error("IP command error:", error);
      return message.reply(
        "❌ 𝐈𝐏 𝐝𝐚𝐭𝐚 𝐟𝐞𝐭𝐜𝐡 𝐤𝐨𝐫𝐚 𝐣𝐚𝐲𝐧𝐢.\n" +
        "🔄 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫."
      );
    }
  }
};
