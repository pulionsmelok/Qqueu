const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Photo360 = require("abir-photo360-apis");

module.exports = {
  config: {
    name: "ephoto",
    aliases: [],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    description: {
            en: "Generate stylish images using Ephoto360 templates"
        },
        category: "textmaker",
        guide: {
            en: "/ephoto <template> <name>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, event, args }) {
    if (args.length < 2) {
      return api.sendMessage(
        "Please provide a template ID and a name.\n\nExample:\n/ephoto 1 Siddik",
        event.threadID,
        event.messageID
      );
    }

    const templateKey = String(args[0]).toLowerCase();
    const name = args.slice(1).join(" ") || "IMRAN";
    const cacheDir = path.join(__dirname, "cache");
    const imagePath = path.join(cacheDir, `ephoto_${Date.now()}.png`);

    const templates = {
      "1": "https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html",
      "2": "https://en.ephoto360.com/create-realistic-cloud-text-effect-606.html",
      "3": "https://en.ephoto360.com/light-glow-text-effect-369.html",
      "4": "https://en.ephoto360.com/glitch-text-effect-online-345.html",
      "5": "https://en.ephoto360.com/3d-metal-text-effect-600.html",
      "6": "https://en.ephoto360.com/foggy-rainy-text-effect-75.html",
      "7": "https://en.ephoto360.com/write-in-sand-summer-beach-online-free-595.html",
      "8": "https://en.ephoto360.com/diamond-text-95.html",
      "9": "https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html",
      "10": "https://en.ephoto360.com/create-broken-glass-text-effect-online-698.html",
      "11": "https://en.ephoto360.com/create-multicolored-signature-attachment-arrow-effect-714.html",
      "12": "https://en.ephoto360.com/create-a-graffiti-text-effect-on-the-wall-online-665.html",
      "13": "https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html",
      "14": "https://en.ephoto360.com/creating-text-effects-night-lend-for-word-effect-147.htm",
      "15": "https://en.ephoto360.com/write-text-effect-clouds-in-the-sky-online-619.html",
      "16": "https://en.ephoto360.com/write-in-sand-summer-beach-online-576.html",
      "17": "https://en.ephoto360.com/dark-green-typography-online-359.html",
      "18": "https://en.ephoto360.com/stars-night-online-1-85.html",
      "19": "https://en.ephoto360.com/realistic-3d-sand-text-effect-online-580.html",
      "20": "https://en.ephoto360.com/create-a-summery-sand-writing-text-effect-577.html",
      "21": "https://en.ephoto360.com/text-firework-effect-356.html",
      "22": "https://en.ephoto360.com/ligatures-effects-from-leaves-146.html",
      "23": "https://en.ephoto360.com/write-letters-on-the-leaves-248.html",
      "24": "https://en.ephoto360.com/graffiti-color-199.html",
      "25": "https://en.ephoto360.com/caper-cut-effect-184.html"
    };

    const templateUrl = templates[templateKey];
    if (!templateUrl) {
      return api.sendMessage(
        `Invalid template selected!\n\nAvailable templates:\n${Object.keys(templates).join(", ")}\n\nExample:\n/ephoto 1 Siddik`,
        event.threadID,
        event.messageID
      );
    }

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    let loading = null;
    try {
      loading = await api.sendMessage(
        `⏳ Generating image for "${name}"... Please Wait ⏰`,
        event.threadID
      );

      const photo360 = new Photo360(templateUrl);
      photo360.setName(name);
      const result = await photo360.execute();

      if (!result?.imageUrl) {
        throw new Error("Image URL not found");
      }

      const response = await axios.get(result.imageUrl, {
        responseType: "arraybuffer",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });

      fs.writeFileSync(imagePath, Buffer.from(response.data));

      await api.sendMessage(
        {
          body: `✅ Image generated for "${name}" using template #${templateKey}`,
          attachment: fs.createReadStream(imagePath)
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("Ephoto Error:", err?.message || err);
      await api.sendMessage(
        "❌ Something went wrong while generating the image. Please try again later.",
        event.threadID,
        event.messageID
      );
    } finally {
      if (loading?.messageID || loading?.message_id) {
        try {
          await api.unsendMessage(loading.messageID || loading.message_id);
        } catch (e) {}
      }
      setTimeout(() => {
        if (fs.existsSync(imagePath)) {
          try { fs.unlinkSync(imagePath); } catch (e) {}
        }
      }, 15000);
    }
  }
};
