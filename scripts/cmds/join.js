module.exports = {
  config: {
    name: "join",
    aliases: ["groups", "joinlist"],
    author: "SK-SIDDIK-KHAN",
    version: "1.5.0",
    countDown: 5,
    role: 2,
    
    
    usePrefix: true,
    description: {
            en: "Show active groups where the bot is currently a member"
        },
        category: "admin",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async ({ ctx, message, threadModel }) => {
    try {
      const groups = await getGroups(threadModel, ctx);

      if (!groups.length)
        return message.reply("❌ No active groups found.");

      await showPage(ctx, message, groups, 0);
    } catch (err) {
      console.error("JOIN ERROR:", err);
      message.reply("❌ Failed to load group list.");
    }
  },

  onCallback: async ({ ctx, threadModel }) => {
    try {
      const groups = await getGroups(threadModel, ctx);
      if (!groups.length)
        return ctx.answerCbQuery("❌ No active groups found.");

      const data = ctx.callbackQuery?.data || "";

      if (data === "join_refresh") {
        await ctx.answerCbQuery("🔄 Refreshed");
        return showPage(ctx, null, groups, 0);
      }

      if (data === "join_noop") {
        return ctx.answerCbQuery("❌ No invite link available");
      }

      if (!data.startsWith("join_page_")) return;

      const page = Number(data.replace("join_page_", "")) || 0;

      await ctx.answerCbQuery();
      return showPage(ctx, null, groups, page);
    } catch (err) {
      console.error("JOIN CALLBACK ERROR:", err);
      try {
        await ctx.answerCbQuery("❌ Error");
      } catch {}
    }
  }
};

async function getGroups(threadModel, ctx) {
  let rows = [];

  if (threadModel) {
    try {
      rows = await threadModel.find({
        $or: [
          { isGroup: true },
          { threadID: /^-/ }
        ]
      }).lean();
    } catch {}
  }

  if (!rows.length) {
    rows = [
      ...(global.db?.allThreadData || []),
      ...(global.db?.allThreadInfo || [])
    ];
  }

  const ids = [...new Set(
    rows
      .map(x => String(x.threadID || x.chatId || x.id || ""))
      .filter(id => id.startsWith("-"))
  )];

  const groupsMap = new Map();

  for (const chatId of ids) {
    try {
      const botId =
        ctx.botInfo?.id ||
        ctx.me?.id ||
        ctx.from?.id;

      if (!botId) continue;

      const member = await ctx.telegram.getChatMember(chatId, botId);
      const status = member?.status;

      if (["left", "kicked", "banned"].includes(status))
        continue;

      const chat = await ctx.telegram.getChat(chatId);
      const title = (chat?.title || "Unknown Group").trim();

      if (groupsMap.has(title)) {
        const existing = groupsMap.get(title);
        if (!existing.username && chat?.username) {
          groupsMap.set(title, {
            id: chatId,
            title: title,
            username: chat.username || ""
          });
        }
        continue;
      }

      groupsMap.set(title, {
        id: chatId,
        title: title,
        username: chat?.username || ""
      });
    } catch {}
  }

  return Array.from(groupsMap.values());
}

async function getLink(ctx, group) {
  if (group.username) {
    return "https://t.me/" + group.username;
  }

  try {
    const link = await ctx.telegram.exportChatInviteLink(group.id);
    if (link) return link;
  } catch {}

  try {
    const result = await ctx.telegram.createChatInviteLink(group.id, {
      name: "Bot Join Link",
      creates_join_request: false
    });
    if (result && result.invite_link) return result.invite_link;
  } catch {}

  return null;
}

async function showPage(ctx, message, groups, page) {
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage));

  page = Math.max(0, Math.min(page, totalPages - 1));

  const start = page * perPage;
  const current = groups.slice(start, start + perPage);

  let text = "╭───❍ 𝐒𝐈𝐃𝐃𝐈𝐊-𝐁𝐎𝐓 ❍───╮\n";
  text += "│\n";
  text += "│ 👥 Active Groups: " + groups.length + "\n";
  text += "│ 📄 Page: " + (page + 1) + "/" + totalPages + "\n";
  text += "│\n";

  const keyboard = [];

  for (let i = 0; i < current.length; i++) {
    const group = current[i];
    const link = await getLink(ctx, group);

    text += "│ " + (start + i + 1) + ". " + group.title + "\n";

    if (link) {
      keyboard.push([
        {
          text: "🚀 Join " + group.title.slice(0, 18),
          url: link
        }
      ]);
    } else {
      keyboard.push([
        {
          text: "❌ " + group.title.slice(0, 15) + " - No Link",
          callback_data: "join_noop"
        }
      ]);
    }
  }

  text += "│\n╰────────────────────╯";

  const nav = [];

  if (page > 0) {
    nav.push({
      text: "⬅️ Prev",
      callback_data: "join_page_" + (page - 1)
    });
  }

  if (page < totalPages - 1) {
    nav.push({
      text: "Next ➡️",
      callback_data: "join_page_" + (page + 1)
    });
  }

  if (nav.length) keyboard.push(nav);

  keyboard.push([
    {
      text: "🔄 Refresh List",
      callback_data: "join_refresh"
    }
  ]);

  const options = {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };

  if (message && message.reply) {
    return message.reply(text, options);
  }

  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    return ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      text,
      options
    );
  }

  return ctx.reply(text, options);
}