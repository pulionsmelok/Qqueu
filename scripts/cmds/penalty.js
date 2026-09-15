const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const dossierCache = path.join(__dirname, "tmp");
if (!fs.existsSync(dossierCache)) fs.mkdirSync(dossierCache);
if (!global.penaltyGames) global.penaltyGames = new Map();

module.exports = {
  config: {
    name: "penalty",
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 20,
    role: 0,
    description: {
            en: "Football penalty shootout game"
        },
        category: "game",
        guide: {
            en: "{p}penalty <bet>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ args, message, event, usersData, api }) {
    try {
      if (args.length !== 1 || isNaN(parseInt(args[0]))) {
        return message.reply("Please provide a valid bet amount.\nExample: /penalty 1000");
      }
      const bet = parseInt(args[0]);
      const uid = String(event.senderID);
      if (bet <= 0) return message.reply("The bet must be greater than 0.");
      const userData = await usersData.get(uid);
      const balance = Number(userData?.money || 0);
      if (bet > balance) {
        return message.reply(`❌ You don't have enough money.\n💰 Balance: ${balance}`);
      }
      global.penaltyGames.delete(uid);
      const image = await loadImage("https://i.ibb.co/gmKRSrJ/Screenshot-208.png");
      const imageBuffer = await sauvegarderImageDansCache(image);
      const sent = await api.sendPhoto(event.threadID, imageBuffer, {
        caption: `⚽ Penalty Shootout!\n💰 Bet: ${bet} coins\n🎯 Choose where to shoot:`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⬅️ Left", callback_data: "penalty:left" },
              { text: "🎯 Middle", callback_data: "penalty:middle" },
              { text: "➡️ Right", callback_data: "penalty:right" }
            ],
            [
              { text: "↖️ Top Left", callback_data: "penalty:topleft" },
              { text: "↗️ Top Right", callback_data: "penalty:topright" }
            ]
          ]
        }
      });
      const messageID = sent?.message_id || sent?.messageID;
      global.penaltyGames.set(uid, {
        bet,
        messageID,
        threadID: event.threadID,
        time: Date.now()
      });
    } catch (error) {
      console.error("Error in penalty onStart:", error);
      return message.reply("An error occurred. Please try again.");
    }
  },
  onCallback: async function ({ event, api, message, args }) {
    try {
      const uid = String(event.senderID || event.userID || event.from?.id);
      const gameData = global.penaltyGames.get(uid);
      if (!gameData) {
        if (api?.answerCallbackQuery) {
          await api.answerCallbackQuery(event.callbackQueryID, "⚠️ This game expired or not yours.", true);
        }
        return;
      }
      if (api?.answerCallbackQuery) {
        await api.answerCallbackQuery(event.callbackQueryID);
      }
      let choice = "";
      const rawData = String(event.data || event.callbackData || "").toLowerCase().trim();
      if (rawData) {
        choice = rawData.replace(/^penalty[:_]/i, "").trim();
      }
      if (!choice && Array.isArray(args) && args.length > 0) {
        if (String(args[0]).toLowerCase() === "penalty") {
          choice = args.slice(1).join(" ").toLowerCase().trim();
        } else {
          choice = args.join(" ").toLowerCase().trim();
        }
      }
      choice = choice.replace(/_/g, " ").replace(/\s+/g, " ").trim();
      const map = {
        left: "left",
        right: "right",
        middle: "middle",
        topleft: "top left",
        "top left": "top left",
        topright: "top right",
        "top right": "top right"
      };
      choice = map[choice] || choice;
      const validChoices = ["left", "right", "middle", "top left", "top right"];
      if (!validChoices.includes(choice)) {
        return message.reply(`Invalid choice: "${choice}"`);
      }
      const usersData = global.db.usersData;
      if (!usersData) {
        return message.reply("❌ Database not ready. Try again.");
      }
      const userData = await usersData.get(uid);
      const currentMoney = Number(userData?.money || 0);
      const bet = Number(gameData.bet);
      if (bet > currentMoney) {
        global.penaltyGames.delete(uid);
        return message.reply("❌ You no longer have enough money for this bet.");
      }
      const random = Math.random();
      let win = false;
      if (choice === "left" || choice === "right") win = random < 0.5;
      else if (choice === "middle") win = random < 0.7;
      else if (choice === "top left" || choice === "top right") win = random < 0.4;
      let resultImage, resultText, finalMoney;
      if (win) {
        resultImage = await loadImage("https://i.ibb.co/S6y5CKC/Screenshot-210.png");
        finalMoney = currentMoney + bet;
        resultText = `⚽ Goal! You won ${bet * 2} coins.`;
      } else if (random < 0.1) {
        resultImage = await loadImage("https://i.ibb.co/JtsPh4R/Screenshot-205.png");
        finalMoney = currentMoney - bet;
        resultText = `🧤 Saved by the goalkeeper! You lost ${bet} coins.`;
      } else {
        resultImage = await loadImage("https://i.ibb.co/7rQyN4y/Screenshot-206.png");
        finalMoney = currentMoney - bet;
        resultText = `❌ Missed! You lost ${bet} coins.`;
      }
      await usersData.set(uid, { money: finalMoney });
      const imageBuffer = await sauvegarderImageDansCache(resultImage);
      try {
        if (gameData.messageID && gameData.threadID) {
          await api.deleteMessage(gameData.threadID, gameData.messageID).catch(() => {});
        }
      } catch (e) {}
      await api.sendPhoto(event.threadID, imageBuffer, {
        caption: `${resultText}\n💰 Balance: ${finalMoney} coins.`
      });
      global.penaltyGames.delete(uid);
    } catch (error) {
      console.error("Error in penalty onCallback:", error);
      return message.reply("An error occurred. Please try again.");
    }
  }
};

async function sauvegarderImageDansCache(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return canvas.toBuffer("image/png");
}
