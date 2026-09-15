module.exports = {
  config: {
    name: "setbalance",
    aliases: ["setbal", "set"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    role: 2,
    usePrefix: true,
    description: {
            en: "Add, remove, transfer or zero out balance of users"
        },
        category: "ECONOMY",
        guide: {
            en: "{pn} add/remove/out/transfer [amount] [uid]\n{pn} add/remove/out/transfer [uid] [amount]\nOr mention / reply a user"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions = {}, messageReply = null } = event;
    const action = (args[0] || "").toLowerCase();
    const send = (text) => api.sendMessage(text, threadID, messageID);

    if (!["add", "remove", "transfer", "out"].includes(action)) {
      return send("┌───────────⭓\n│❗ Usage\n├───────────\n│set add [amount] [uid]\n│ set remove [amount] [uid]\n│ set transfer [amount] [uid]\n│ set out [uid]\n└───────────⭓");
    }

    const numbers = args.slice(1).filter(a => a && !isNaN(a.replace?.(/,/g, "") || a));

    let amount = null;
    let targetID = null;

    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      if (numbers[0]) amount = Number(numbers[0].replace(/,/g, ""));
    }
    else if (messageReply && messageReply.senderID) {
      targetID = String(messageReply.senderID);
      if (numbers[0]) amount = Number(numbers[0].replace(/,/g, ""));
    }
    else if (numbers.length >= 2) {
      const n1 = numbers[0].replace(/,/g, "");
      const n2 = numbers[1].replace(/,/g, "");

      if (n1.length <= 15 && n2.length > 15) {
        targetID = n1;
        amount = Number(n2);
      } else if (n2.length <= 15 && n1.length > 15) {
        targetID = n2;
        amount = Number(n1);
      } else {
        amount = Number(n1);
        targetID = n2;
      }
    }
    else if (numbers.length === 1) {
      const n = numbers[0].replace(/,/g, "");
      if (action === "out") {
        targetID = n;
      } else {
        amount = Number(n);
      }
    }

    if (["add", "remove", "transfer"].includes(action)) {
      if (amount === null || isNaN(amount) || amount <= 0) {
        return send("❌ Please enter a valid amount.");
      }
      if (amount > Number.MAX_SAFE_INTEGER) {
        return send("❌ Amount is too large. Maximum safe amount is " + Number.MAX_SAFE_INTEGER);
      }
    }

    if (!targetID && action !== "out") {
      return send("❌ Please mention, reply to a user, or provide UID.");
    }

    if (action === "out" && !targetID) {
      return send("❌ Please specify a user (mention/reply/uid) to reset balance.");
    }

    try {
      switch (action) {
        case "add": {
          await usersData.addMoney(targetID, amount);
          const targetData = await usersData.get(targetID);
          const name = targetData?.name || `User ${targetID}`;
          return send(`━━━━━━━━━━━━━━\n✅ Added ${amount}💵\n━━━━━━━━━━━━━━\nto ${name}'s balance\n━━━━━━━━━━━━━━`);
        }
        case "remove": {
          await usersData.subtractMoney(targetID, amount);
          const targetData = await usersData.get(targetID);
          const name = targetData?.name || `User ${targetID}`;
          return send(`━━━━━━━━━━━━━━\n✅ Removed ${amount}💵\n━━━━━━━━━━━━━━\nfrom ${name}'s balance\n━━━━━━━━━━━━━━`);
        }
        case "out": {
          await usersData.set(targetID, { money: 0 });
          const targetData = await usersData.get(targetID);
          const name = targetData?.name || `User ${targetID}`;
          return send(`❌ ${name}'s balance has been reset to 0.`);
        }
        case "transfer": {
          if (String(targetID) === String(senderID)) return send("❌ You can't transfer to yourself.");
          const senderData = await usersData.get(senderID);
          if ((senderData.money || 0) < amount) {
            return send("❌ You don't have enough balance to transfer.");
          }
          await usersData.subtractMoney(senderID, amount);
          await usersData.addMoney(targetID, amount);
          const targetData = await usersData.get(targetID);
          const targetName = targetData?.name || `User ${targetID}`;
          return send(`━━━━━━━━━━━━━━\n✅ Transferred ${amount}💵 \n━━━━━━━━━━━━━━\nto${targetName}\n━━━━━━━━━━━━━━`);
        }
      }
    } catch (err) {
      console.error("setbalance error:", err);
      return send("❌ Error: " + (err.message || err));
    }
  }
};
