const axios = require("axios");
const dns = require("dns").promises;
const https = require("https");

module.exports = {
  config: {
    name: "webinfo",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Fetch full info like IP, SSL, Server, Response, Country from any website"
        },
        category: "ai",
        guide: {
            en: "{p}webinfo <url>\nExample: {p}webinfo https://google.com"
        }
},
  langs: {
    en: {
      missing: "⚠️  Pʟᴇᴀsᴇ Pʀᴏᴠɪᴅᴇ A Vᴀʟɪᴅ Uʀʟ\n📌  Eɢ : webinfo google.com",
      loading: "🔍  Aɴᴀʟʏᴢɪɴɢ Wᴇʙsɪᴛᴇ...\n🌐  %1",
      error: "❌  Fᴀɪʟᴇᴅ Tᴏ Fᴇᴛᴄʜ Wᴇʙ Iɴғᴏ"
    }
  },
  onStart: async function ({ message, args, getLang }) {
    if (!args[0]) {
      return message.reply(getLang("missing"));
    }
    let loadingMsg;
    try {
      let input = args[0].trim();
      input = input.replace(/^https?:\/\//i, "");
      input = input.replace(/^www\./i, "");
      input = input.split("/")[0];
      input = input.split("?")[0];
      input = input.split("#")[0];
      const domain = input;
      const url = `https://${domain}`;
      loadingMsg = await message.reply(getLang("loading", domain));
      let ip = "N/A";
      try {
        const dnsRes = await dns.lookup(domain);
        ip = dnsRes.address;
      } catch {}
      let ssl = "🔴  Nᴏ Sᴇᴄᴜʀᴇ";
      try {
        await new Promise((resolve) => {
          const req = https.request(
            {
              hostname: domain,
              method: "HEAD",
              port: 443,
              rejectUnauthorized: true
            },
            () => {
              ssl = "🟢  Vᴀʟɪᴅ";
              resolve();
            }
          );
          req.on("error", () => resolve());
          req.on("timeout", () => {
            req.destroy();
            resolve();
          });
          req.end();
        });
      } catch {}
      let responseTime = "N/A";
      let server = "Uɴᴋɴᴏᴡɴ";
      try {
        const start = Date.now();
        const res = await axios.get(url, {
          maxRedirects: 5,
          validateStatus: () => true
        });
        responseTime = Date.now() - start;
        server = res.headers["server"] || "Uɴᴋɴᴏᴡɴ";
      } catch {}
      let country = "N/A";
      if (ip !== "N/A") {
        try {
          const geo = await axios.get(
            `https://ipapi.co/${ip}/json/`,
            { timeout: 10000 }
          );
          country = geo.data.country_name || "N/A";
        } catch {}
      }
      const output =
        "🌐  Wᴇʙsɪᴛᴇ Iɴғᴏ\n\n" +
        `🔗  Dᴏᴍᴀɪɴ : ${domain}\n` +
        `📍  Iᴘ : ${ip}\n` +
        `🛡️  Sᴇᴄᴜʀɪᴛʏ : ${ssl}\n` +
        `⚡  Rᴇsᴘᴏɴsᴇ : ${responseTime} ms\n` +
        `🧠  Sᴇʀᴠᴇʀ : ${server}\n` +
        `🌍  Cᴏᴜɴᴛʀʏ : ${country}`;
      if (loadingMsg && loadingMsg.messageID) {
        try {
          await message.unsend(loadingMsg.messageID);
        } catch {}
      }
      return message.reply(output);
    } catch (err) {
      console.error(err);
      if (loadingMsg && loadingMsg.messageID) {
        try {
          await message.unsend(loadingMsg.messageID);
        } catch {}
      }
      return message.reply(getLang("error"));
    }
  }
};
