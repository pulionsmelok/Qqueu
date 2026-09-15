const axios = require('axios');

module.exports = {
  config: {
    name: "namaz",
    aliases: ["prayertime", "namaj", "salah", "salat"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Get real-time Islamic prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for any city."
        },
        category: "Islamic",
        guide: {
            en: "{pn} [city_name]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const city = args.join(" ") || "Dhaka";

    try {
      const res = await axios.get(`http://api.aladhan.com/v1/timingsByCity`, {
        params: {
          city: city,
          country: "Bangladesh",
          method: 1 
        }
      });

      const { timings, date } = res.data.data;
      const infoMsg = `┏━━━━━✦ 🕌 ✦━━━━━┓
Namaj Timings
┗━━━━━━━━━━━━━━━┛

📍 City: ${city.toUpperCase()}
📅 Date: ${date.readable}
🕋 Hijri: ${date.hijri.date}
━━━━━━━━━━━━━━━━
✨ Fajr : ${timings.Fajr}
☀️ Sunrise : ${timings.Sunrise}
📌 Dhuhr : ${timings.Dhuhr}
☁️ Asr : ${timings.Asr}
🌅 Maghrib : ${timings.Maghrib}
🌙 Isha : ${timings.Isha}
━━━━━━━━━━━━━━━━
"Perform prayer, for it restrains from shameful and unjust deeds." 🤲`;

      return api.sendMessage(infoMsg, threadID, messageID);
    } catch (error) {
      return api.sendMessage(`❌ Information for '${city}' not found. Please type the city name correctly in English (e.g., !prayer Dhaka)`, threadID, messageID);
    }
  }
};
