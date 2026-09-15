module.exports = {
  config: {
    name: "help",
        aliases: ["menu", "commands"],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 0,
        role: 0,
        usePrefix: true,
    description: {
            en: "Show all commands in clean UI with buttons"
        },
        category: "system",
        guide: {
            en: "{pn} [command name | page]"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ bot, message, args, prefix, event, chatId, threadID }) {
    try {
      const allCommands = global.GoatBot.commands;
      const targetChat = chatId || threadID || event?.threadID || event?.chat?.id;
      const pfx = prefix || global.utils?.getPrefix?.(targetChat) || "/";
      const fancyFont = (str) =>
        String(str).replace(/[A-Za-z]/g, (c) => {
          const map = {
            A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",
            I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",
            Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",
            Y:"𝐘",Z:"𝐙",
            a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",
            i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",
            q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",
            y:"𝐲",z:"𝐳"
          };
          return map[c] || c;
        });
      const categoryFont = (str) =>
        String(str).split("").map(c => {
          const map = {
            A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",
            I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",
            Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",
            Y:"𝐘",Z:"𝐙"
          };
          return map[c] || c;
        }).join("");
      if (args[0] && isNaN(args[0])) {
        const cmdName = args[0].toLowerCase();
        const cmd =
          allCommands.get(cmdName) ||
          [...allCommands.values()].find(c =>
            (c.config.aliases || [])
              .map(a => String(a).toLowerCase())
              .includes(cmdName)
          );
        if (!cmd)
          return replyMsg(
            bot,
            message,
            targetChat,
`❌ ${fancyFont(`Command '${cmdName}' not found!`)}
➤ Try ${pfx}help to see full list`
          );
        let usage = pfx + cmd.config.name;
        if (typeof cmd.config.guide === "string") {
          usage = cmd.config.guide
            .replace(/{pn}/g, pfx + cmd.config.name)
            .replace(/{p}/g, pfx);
        } else if (cmd.config.guide?.en) {
          usage = String(cmd.config.guide.en)
            .replace(/{pn}/g, pfx + cmd.config.name)
            .replace(/{p}/g, pfx);
        }
        const desc =
          cmd.config.longDescription ||
          cmd.config.shortDescription ||
          (typeof cmd.config.description === "string"
            ? cmd.config.description
            : cmd.config.description?.en) ||
          "No description";
        const infoMsg =
`┌───────────⭓
 │ 𝐂𝐌𝐃 𝐈𝐍𝐅𝐎
 ├───────────
 │ Name     : ${cmd.config.name}
 │ Aliases  : ${(cmd.config.aliases || []).join(", ") || "None"}
 │Category : ${categoryFont((cmd.config.category || "Others").toUpperCase())}
 │Version  : v${cmd.config.version || "1.0"}
 │Author   : ${cmd.config.author || "Unknown"}
 │ Usage    : ${usage}
 └───────────⭓
 📝 ${desc}`;
        return replyMsg(bot, message, targetChat, infoMsg);
      }
      const page = Math.max(1, parseInt(args[0]) || 1);
      return await showPage(
        bot,
        message,
        targetChat,
        pfx,
        page,
        null,
        event,
        fancyFont,
        categoryFont
      );
    } catch (err) {
      return replyMsg(
        bot,
        message,
        chatId || event?.threadID,
        "❌ Help error: " + (err.message || err)
      );
    }
  },
  onCallback: async function ({ bot, event, ctx, message, chatId, threadID, data }) {
    try {
      const cbData = String(
        data ||
        event.callbackData ||
        event.data ||
        event.callback_query?.data ||
        ""
      );
      if (!cbData.startsWith("help_")) return;
      const m = cbData.match(/^help_page_(\d+)$/);
      if (!m) return;
      const page = parseInt(m[1]) || 1;
      const targetChat =
        chatId ||
        threadID ||
        event.threadID ||
        event?.message?.chat?.id;
      const pfx =
        global.utils?.getPrefix?.(targetChat) ||
        global.GoatBot?.config?.prefix ||
        "/";
      const fancyFont = (str) =>
        String(str).replace(/[A-Za-z]/g, (c) => {
          const map = {
            A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",
            I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",
            Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",
            Y:"𝐘",Z:"𝐙",
            a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",
            i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",
            q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",
            y:"𝐲",z:"𝐳"
          };
          return map[c] || c;
        });
      const categoryFont = (str) =>
        String(str).split("").map(c => {
          const map = {
            A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",
            I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",
            Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",
            Y:"𝐘",Z:"𝐙"
          };
          return map[c] || c;
        }).join("");
      try {
        if (ctx?.answerCbQuery) {
          await ctx.answerCbQuery();
        } else if (bot?.answerCallbackQuery && event.callbackQueryID) {
          await bot.answerCallbackQuery(event.callbackQueryID);
        }
      } catch (_) {}
      await showPage(
        bot,
        message,
        targetChat,
        pfx,
        page,
        ctx,
        event,
        fancyFont,
        categoryFont
      );
    } catch (err) {
      try {
        if (ctx?.answerCbQuery) {
          await ctx.answerCbQuery("Error");
        } else if (bot?.answerCallbackQuery) {
          await bot.answerCallbackQuery(
            event.callbackQueryID,
            "Error"
          );
        }
      } catch (_) {}
      console.log("help onCallback error:", err);
    }
  }
};
const PER_PAGE = 20;
const HELP_IMAGE = "https://files.catbox.moe/gct1ii.jpg";

function getCmdsByCategory() {
  const categories = {};
  for (const [name, cmd] of global.GoatBot.commands) {
    const cat = (cmd.config.category || "others").toLowerCase();
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(name);
  }
  for (const cat of Object.keys(categories)) {
    categories[cat].sort();
  }
  return categories;
}

function buildFlatCmds() {
  const categories = getCmdsByCategory();
  const list = [];
  for (const cat of Object.keys(categories).sort()) {
    for (const name of categories[cat]) {
      list.push({
        name,
        cat
      });
    }
  }
  return list;
}

function buildKeyboard(page, totalPages) {
  const row = [];
  if (page > 1) {
    row.push({
      text: "⬅️ Prev",
      callback_data: `help_page_${page - 1}`
    });
  }
  row.push({
    text: `📄 ${page}/${totalPages}`,
    callback_data: `help_page_${page}`
  });
  if (page < totalPages) {
    row.push({
      text: "Next ➡️",
      callback_data: `help_page_${page + 1}`
    });
  }
  const keyboard = [row];
  if (totalPages > 1) {
    const extra = [];
    if (page > 1) {
      extra.push({
        text: "⏪ First",
        callback_data: "help_page_1"
      });
    }
    if (page < totalPages) {
      extra.push({
        text: "Last ⏩",
        callback_data: `help_page_${totalPages}`
      });
    }
    if (extra.length) {
      keyboard.push(extra);
    }
  }
  return {
    inline_keyboard: keyboard
  };
}

function buildPageText(prefix, page, fancyFont, categoryFont) {
  const all = buildFlatCmds();
  const total = all.length;
  const totalPages = Math.max(
    1,
    Math.ceil(total / PER_PAGE)
  );
  const safePage = Math.min(
    Math.max(1, page),
    totalPages
  );
  const start = (safePage - 1) * PER_PAGE;
  const slice = all.slice(
    start,
    start + PER_PAGE
  );
  let msg =
`┌───────────⭓
│𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐌𝐄𝐍𝐔
├───────────
├ Prefix : ${prefix}
├ Total Cmds  : ${total}
├ Page   : ${safePage}/${totalPages}
├👑 DEV : SK SIDDIK
└──────────⭓\n`;
  let lastCat = "";
  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    const next = slice[i + 1];
    if (item.cat !== lastCat) {
      if (lastCat) msg += `└─────────────┘\n`;
      const catTitle = categoryFont(item.cat.toUpperCase());
      msg += `\n┌─ ${catTitle} ─┐\n`;
      lastCat = item.cat;
    }
    msg += `│ ⎙ ${fancyFont(item.name)}\n`;
    if (!next || next.cat !== item.cat) {
      msg += `└─────────────┘\n`;
      lastCat = "";
    }
  }
  msg += `\n╰─ Use: ${prefix}help <command>`;
  return { msg, safePage, totalPages };
}

async function showPage(api, message, chatId, prefix, page, ctx, event, fancyFont, categoryFont) {
  const { msg, safePage, totalPages } = buildPageText(prefix, page, fancyFont, categoryFont);
  const reply_markup = buildKeyboard(safePage, totalPages);
  if (ctx || event?.type === "callback_query" || event?.callbackQueryID) {
    const mid = event?.messageID || event?.message?.message_id || ctx?.message?.message_id;
    const hasPhoto = !!(event?.message?.photo || event?.callbackMessage?.photo || ctx?.message?.photo);
    try {
      if (hasPhoto) {
        if (typeof api.editMessageCaption === "function") {
          await api.editMessageCaption(chatId, mid, msg, { reply_markup });
          return;
        }
        if (ctx && typeof ctx.editMessageCaption === "function") {
          await ctx.editMessageCaption(msg, { reply_markup });
          return;
        }
      }
    } catch (_) {}
    try {
      if (ctx && typeof ctx.editMessageText === "function") {
        await ctx.editMessageText(msg, { reply_markup });
        return;
      }
      if (api && typeof api.editMessageText === "function") {
        await api.editMessageText(chatId, mid, msg, { reply_markup });
        return;
      }
    } catch (e2) {
      console.log("help edit failed:", e2?.message || e2);
    }
  }
  return replyPhoto(api, message, chatId, HELP_IMAGE, msg, reply_markup);
}

async function replyPhoto(api, message, chatId, photo, caption, reply_markup) {
  const opts = { caption, ...(reply_markup ? { reply_markup } : {}) };
  try {
    if (api && typeof api.sendPhoto === "function") {
      return await api.sendPhoto(chatId, photo, opts);
    }
  } catch (e) {
    console.log("help sendPhoto failed:", e?.message || e);
  }
  return replyMsg(api, message, chatId, caption, reply_markup);
}

async function replyMsg(api, message, chatId, text, reply_markup) {
  const opts = reply_markup ? { reply_markup } : undefined;
  if (message && typeof message.reply === "function") {
    try {
      if (opts) return await message.reply({ body: text, reply_markup });
      return await message.reply(text);
    } catch (_) {}
  }
  if (api && typeof api.sendMessage === "function") {
    return await api.sendMessage(text, chatId, opts);
  }
  throw new Error("No send method available");
}
