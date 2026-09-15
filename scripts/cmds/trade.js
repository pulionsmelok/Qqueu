module.exports = {
  config: {
    name: "trade",
    aliases: ["quotex", "qx"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 5,
    role: 0,
    usePrefix: true,
    description: {
            en: "Predict market movement (up/down) and win virtual money."
        },
        category: "GAMES",
        guide: {
            en: "{pn} <amount> <up/down>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, message, event, args, usersData }) {
    const { threadID, senderID } = event;
    const userData = await usersData.get(senderID);
    const balance = Number(userData?.money) || 0;
    if (args.length < 2) {
      return message.reply("❌ Format vul! \nSothik niyom: /quotex <amount> <up/down>");
    }
    const betAmount = parseInt(args[0]);
    const prediction = args[1].toLowerCase();
    if (isNaN(betAmount) || betAmount < 10) {
      return message.reply("❌ Minimum $10 trade korte hobe!");
    }
    if (betAmount > balance) {
      return message.reply(`❌ Apnar jottheshtho balance nei! Bortoman balance: $${balance}`);
    }
    if (prediction !== "up" && prediction !== "down") {
      return message.reply("❌ Shudhu 'up' (Call) ba 'down' (Put) prediction korun!");
    }
    const tradeMessage = await message.reply(
      `📈 **QUOTEX TRADE STARTED**
━━━━━━━━━━━━━━
🎯 Prediction: ${prediction === "up" ? "🟢 UP" : "🔴 DOWN"}
💰 Amount: $${betAmount}
⏳ Status: Analyzing Market...
━━━━━━━━━━━━━━`
    );
    setTimeout(async () => {
      try {
        const messageID = tradeMessage?.messageID || tradeMessage?.message_id;
        if (messageID && api.deleteMessage) {
          await api.deleteMessage(threadID, messageID).catch(() => {});
        }
        const latestData = await usersData.get(senderID);
        const latestBalance = Number(latestData?.money) || 0;
        if (betAmount > latestBalance) {
          return message.reply("❌ Trade failed! Apnar balance kom.");
        }
        const isWin = Math.random() < 0.40;
        const payout = 1.20;
        if (isWin) {
          const profit = Math.floor(betAmount * payout);
          const newBalance = latestBalance + profit;
          await usersData.set(senderID, { money: newBalance });
          return message.reply(
            `🎉 **PROFIT!**
━━━━━━━━━━━━━━
💹 Result: ${prediction.toUpperCase()} ✅
💰 Payout: +$${profit}
📈 New Balance: $${newBalance}
━━━━━━━━━━━━━━`
          );
        }
        const newBalance = latestBalance - betAmount;
        await usersData.set(senderID, { money: newBalance });
        return message.reply(
          `💀 **LOSS!**
━━━━━━━━━━━━━━
💹 Result: ${prediction === "up" ? "DOWN" : "UP"} ❌
📉 Lost: -$${betAmount}
📉 New Balance: $${newBalance}
━━━━━━━━━━━━━━`
        );
      } catch (err) {
        console.error("Trade result error:", err);
      }
    }, 10000);
  }
};
