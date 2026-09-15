const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "Siddik");
const CONFIG_FILE = path.join(__dirname, "../../config.json");
const PER_PAGE = 8;

function safeName(value, max = 24) {
  try {
    const s = String(value || "Unknown").replace(/[\u0000-\u001F\u007F]/g, "").trim() || "Unknown";
    const chars = Array.from(s);
    return chars.length > max ? chars.slice(0, max).join("") + "…" : s;
  } catch {
    return "Unknown";
  }
}

function adminIds() {
  const list = global.GoatBot?.config?.adminBot || [];
  return (Array.isArray(list) ? list : [list]).filter(Boolean).map(String);
}

function isBotAdmin(userId) {
  return adminIds().includes(String(userId));
}

function cfg() {
  return global.GoatBot.config;
}

function panel() {
  if (!cfg().settingPanel) cfg().settingPanel = {};
  const p = cfg().settingPanel;

  if (typeof p.maintenance !== "boolean") p.maintenance = false;
  if (typeof p.antilink !== "boolean") p.antilink = false;
  if (typeof p.spammute !== "boolean") p.spammute = false;
  if (typeof p.cooldown !== "boolean") p.cooldown = false;

  return p;
}

async function saveConfig() {
  try {
    await fs.writeJson(global.client?.dirConfig || CONFIG_FILE, cfg(), { spaces: 2 });
  } catch {
    try {
      await fs.writeJson(CONFIG_FILE, cfg(), { spaces: 2 });
    } catch {}
  }
}

function yn(value) {
  return value ? "🟢 ON" : "🔴 OFF";
}

async function edit(ctx, text, keyboard) {
  const options = {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };

  try {
    return await ctx.editMessageText(text, options);
  } catch {
    try {
      return await ctx.reply(text, options);
    } catch {}
  }
}

async function getThreadSettings(threadID) {
  const fallback = {
    sendWelcomeMessage: true,
    sendLeaveMessage: true
  };

  try {
    const data = await global.db?.threadsData?.get(threadID);
    return {
      ...fallback,
      ...(data?.settings || {})
    };
  } catch {
    return fallback;
  }
}

async function setThreadSetting(threadID, key, value) {
  if (!threadID || !global.db?.threadsData) return false;

  try {
    const data = await global.db.threadsData.get(threadID);
    const settings = { ...(data?.settings || {}) };

    settings[key] = value;

    await global.db.threadsData.set(threadID, {
      settings
    });

    return true;
  } catch {
    return false;
  }
}

function getCommandRole(command, threadData) {
  const name = command?.config?.name;
  const override = threadData?.data?.setRole?.[name];

  if (override !== undefined && override !== null) {
    return Number(override);
  }

  return Number(command?.config?.role ?? 0);
}

async function getRolePage(threadID, page) {
  const threadData =
    global.db?.allThreadData?.find(
      t => String(t.threadID) === String(threadID)
    ) || {};

  const commands = [
    ...(global.GoatBot?.commands?.values() || [])
  ]
    .filter(c => c?.config?.name)
    .sort((a, b) =>
      String(a.config.name).localeCompare(
        String(b.config.name)
      )
    );

  const unique = [
    ...new Map(
      commands.map(c => [
        String(c.config.name),
        c
      ])
    ).values()
  ];

  const totalPages = Math.max(
    1,
    Math.ceil(unique.length / PER_PAGE)
  );

  page = Math.max(
    0,
    Math.min(
      Number(page) || 0,
      totalPages - 1
    )
  );

  const items = unique.slice(
    page * PER_PAGE,
    (page + 1) * PER_PAGE
  );

  return {
    threadData,
    items,
    page,
    totalPages,
    total: unique.length
  };
}

async function renderMain(ctx, extra = "") {
  const c = cfg();
  const botName = safeName(
    c.botInfo?.name ||
    c.nickNameBot ||
    "Goatbot-V2",
    24
  );

  const text =
`${extra ? extra + "\n" : ""}┌───────────⭓
│ ${botName}
├───────────
│ ⚙️ CONTROL PANEL V6.5
└───────────⭓`;

  const keyboard = [
    [
      {
        text: "⚙️ General Settings",
        callback_data: "setting_general"
      }
    ],
    [
      {
        text: "🔐 Security & Protection",
        callback_data: "setting_security"
      }
    ],
    [
      {
        text: "💬 Message & Events",
        callback_data: "setting_message"
      }
    ],
    [
      {
        text: "🛡️ Role Manager",
        callback_data: "setting_roles_0"
      }
    ],
    [
      {
        text: "📊 System",
        callback_data: "setting_system"
      },
      {
        text: "🔄 Restart",
        callback_data: "setting_restart"
      }
    ],
    [
      {
        text: "🔧 Fix Files",
        callback_data: "setting_fixfiles"
      },
      {
        text: "🗑️ Clear Cache",
        callback_data: "setting_clearcache"
      }
    ]
  ];

  return edit(ctx, text, keyboard);
}

async function renderGeneral(ctx) {
  const c = cfg();

  const text =
`┌───────────⭓
│ ⚙️ GENERAL SETTINGS
├───────────
│ 📌 Prefix: ${safeName(c.prefix || "/", 10)}
│ ${yn(c.prefixModeEnabled === true)} - Prefix Mode
│ ${yn(c.adminOnly?.enable === true)} - Admin Only
│ ${yn(c.whiteListMode?.enable === true)} - WhiteList Mode
│ ${yn(c.whiteListModeThread?.enable === true)} - WhiteList Groups
└───────────⭓`;

  const keyboard = [
    [
      {
        text: `${yn(c.prefixModeEnabled === true)} - Prefix Mode`,
        callback_data: "setting_toggle_prefix"
      }
    ],
    [
      {
        text: `${yn(c.adminOnly?.enable === true)} - Admin Only`,
        callback_data: "setting_toggle_adminonly"
      }
    ],
    [
      {
        text: `${yn(c.whiteListMode?.enable === true)} - WhiteList Mode`,
        callback_data: "setting_toggle_whitelist"
      }
    ],
    [
      {
        text: `${yn(c.whiteListModeThread?.enable === true)} - WhiteList Groups`,
        callback_data: "setting_toggle_whitelistthread"
      }
    ],
    [
      {
        text: "⬅️ Back",
        callback_data: "setting_main"
      }
    ]
  ];

  return edit(ctx, text, keyboard);
}

async function renderSecurity(ctx) {
  const p = panel();

  const text =
`┌───────────⭓
│ 🔐 SECURITY & PROTECTION
├───────────
│ ${yn(p.maintenance)} - Maintenance
│ ${yn(p.antilink)} - Anti-Link (Global)
│ ${yn(p.spammute)} - Spam Mute (Global)
│ ${yn(p.cooldown)} - Cooldown System
└───────────⭓`;

  const keyboard = [
    [
      {
        text: `${yn(p.maintenance)} - Maintenance`,
        callback_data: "setting_toggle_maintenance"
      }
    ],
    [
      {
        text: `${yn(p.antilink)} - Anti-Link (Global)`,
        callback_data: "setting_toggle_antilink"
      }
    ],
    [
      {
        text: `${yn(p.spammute)} - Spam Mute (Global)`,
        callback_data: "setting_toggle_spammute"
      }
    ],
    [
      {
        text: `${yn(p.cooldown)} - Cooldown System`,
        callback_data: "setting_toggle_cooldown"
      }
    ],
    [
      {
        text: "⬅️ Back",
        callback_data: "setting_main"
      }
    ]
  ];

  return edit(ctx, text, keyboard);
}

async function renderMessage(ctx, threadID) {
  const s = await getThreadSettings(threadID);

  const text =
`┌───────────⭓
│ 💬 MESSAGE & EVENTS
├───────────
│ ${yn(s.sendWelcomeMessage !== false)} - Welcome Message
│ ${yn(s.sendLeaveMessage !== false)} - Leave Message
└───────────⭓`;

  const keyboard = [
    [
      {
        text: `${yn(s.sendWelcomeMessage !== false)} - Welcome Message`,
        callback_data: "setting_toggle_welcome"
      }
    ],
    [
      {
        text: `${yn(s.sendLeaveMessage !== false)} - Leave Message`,
        callback_data: "setting_toggle_leave"
      }
    ],
    [
      {
        text: "⬅️ Back",
        callback_data: "setting_main"
      }
    ]
  ];

  return edit(ctx, text, keyboard);
}

async function renderRoles(ctx, threadID, page = 0) {
  const {
    threadData,
    items,
    totalPages,
    total
  } = await getRolePage(threadID, page);

  const currentPage = Math.max(
    0,
    Math.min(
      Number(page) || 0,
      totalPages - 1
    )
  );

  const textLines = [
    "│ 🌐 0 = Everyone",
    "│ 🛡️ 1 = Group Admin",
    "│ 🔒 2 = Bot Admin"
  ];

  for (const cmd of items) {
    const role = getCommandRole(cmd, threadData);

    const icon =
      role >= 2
        ? "🔒"
        : role === 1
          ? "🛡️"
          : "🌐";

    textLines.push(
      `│ ${icon} /${cmd.config.name} [${role}]`
    );
  }

  const text =
`┌───────────⭓
│ 🛡️ ROLE MANAGER
├───────────
${textLines.join("\n")}
├───────────
│ 📄 Page: ${currentPage + 1}/${totalPages}
│ 📦 Total: ${total}
└───────────⭓`;

  const keyboard = items.map(cmd => {
    const role = getCommandRole(cmd, threadData);

    const icon =
      role >= 2
        ? "🔒"
        : role === 1
          ? "🛡️"
          : "🌐";

    return [
      {
        text: `${icon} /${cmd.config.name} [${role}]`,
        callback_data:
          `setting_role_edit:${cmd.config.name}`
      }
    ];
  });

  const nav = [];

  if (currentPage > 0) {
    nav.push({
      text: "⬅️ Prev",
      callback_data:
        `setting_roles_${currentPage - 1}`
    });
  }

  nav.push({
    text:
      `📄 ${currentPage + 1}/${totalPages} • ${total}`,
    callback_data: "setting_noop"
  });

  if (currentPage < totalPages - 1) {
    nav.push({
      text: "Next ➡️",
      callback_data:
        `setting_roles_${currentPage + 1}`
    });
  }

  keyboard.push(nav);

  keyboard.push([
    {
      text: "⬅️ Back",
      callback_data: "setting_main"
    }
  ]);

  return edit(ctx, text, keyboard);
}

async function renderRoleEdit(ctx, threadID, commandName) {
  const command =
    global.GoatBot?.commands?.get(commandName);

  if (!command) {
    return renderRoles(ctx, threadID, 0);
  }

  const threadData =
    global.db?.allThreadData?.find(
      t => String(t.threadID) === String(threadID)
    ) || {};

  const current =
    getCommandRole(command, threadData);

  const text =
`┌───────────⭓
│ 🛠️ EDIT ROLE
├───────────
│ 📌 /${commandName}
│ 🔢 Current Role: ${current}
├───────────
│ 🌐 0 = Everyone
│ 🛡️ 1 = Group Admin
│ 🔒 2 = Bot Admin
└───────────⭓`;

  const keyboard = [
    [
      {
        text: `${current === 0 ? "✅" : ""} 🌐 0`,
        callback_data:
          `setting_role_save:${commandName}:0`
      },
      {
        text: `${current === 1 ? "✅" : ""} 🛡️ 1`,
        callback_data:
          `setting_role_save:${commandName}:1`
      },
      {
        text: `${current === 2 ? "✅" : ""} 🔒 2`,
        callback_data:
          `setting_role_save:${commandName}:2`
      }
    ],
    [
      {
        text: "⬅️ Back",
        callback_data: "setting_roles_0"
      }
    ]
  ];

  return edit(ctx, text, keyboard);
}

async function saveRole(threadID, commandName, role) {
  if (!global.db?.threadsData) return false;

  const data =
    await global.db.threadsData.get(threadID);

  const threadData =
    data?.data || {};

  const setRole =
    { ...(threadData.setRole || {}) };

  const command =
    global.GoatBot?.commands?.get(commandName);

  const defaultRole =
    Number(command?.config?.role ?? 0);

  if (Number(role) === defaultRole) {
    delete setRole[commandName];
  } else {
    setRole[commandName] = Number(role);
  }

  await global.db.threadsData.set(
    threadID,
    {
      data: {
        ...threadData,
        setRole
      }
    }
  );

  return true;
}

async function renderSystem(ctx) {
  const c = cfg();

  const commands = new Set(
    [
      ...(global.GoatBot?.commands?.values() || [])
    ]
      .map(x => x?.config?.name)
      .filter(Boolean)
  ).size;

  const users =
    global.db?.allUserData?.length || 0;

  const groups =
    global.db?.allThreadData?.length || 0;

  /* Original event count source + safe fallback */
  let events = 0;

  if (global.GoatBot?.events?.size) {
    events = global.GoatBot.events.size;
  } else if (global.GoatBot?.eventCommands?.size) {
    events = global.GoatBot.eventCommands.size;
  } else if (Array.isArray(global.GoatBot?.eventCommands)) {
    events = global.GoatBot.eventCommands.length;
  } else if (
    global.GoatBot?.eventCommands &&
    typeof global.GoatBot.eventCommands === "object"
  ) {
    events = Object.keys(
      global.GoatBot.eventCommands
    ).length;
  }

  const text =
`┌───────────⭓
│ 📊 SYSTEM
├───────────
│ 📦 Commands: ${commands}
│ 👥 Users: ${users}
│ 💬 Groups: ${groups}
│ ⚡ Events: ${events}
│ 🔧 Prefix: ${c.prefix || "/"}
└───────────⭓`;

  return edit(
    ctx,
    text,
    [
      [
        {
          text: "⬅️ Back",
          callback_data: "setting_main"
        }
      ]
    ]
  );
}

async function clearCache(ctx) {
  try {
    if (
      global.client?.countDown &&
      typeof global.client.countDown === "object"
    ) {
      for (
        const key of Object.keys(
          global.client.countDown
        )
      ) {
        delete global.client.countDown[key];
      }
    }

    if (global.onCallback?.clear)
      global.onCallback.clear();

    if (global.temp?.settingSpam?.clear)
      global.temp.settingSpam.clear();

    if (global.temp?.telegramEventDedupe?.clear)
      global.temp.telegramEventDedupe.clear();

    const cacheDir =
      path.join(process.cwd(), "cache");

    if (fs.existsSync(cacheDir)) {
      for (
        const name of await fs.readdir(cacheDir)
      ) {
        try {
          await fs.remove(
            path.join(cacheDir, name)
          );
        } catch {}
      }
    }

    try {
      await ctx.answerCbQuery(
        "✅ Cache Cleared!",
        true
      );
    } catch {}

    return renderMain(
      ctx,
      "✅ Cache cleared successfully!"
    );

  } catch {
    try {
      await ctx.answerCbQuery(
        "⚠️ Cache partially cleared.",
        true
      );
    } catch {}

    return renderMain(ctx);
  }
}

async function fixFiles(ctx) {
  await fs.ensureDir(DATA_DIR);

  const created = [];

  const files = [
    [
      "prefixmode.json",
      JSON.stringify(
        {
          enabled:
            cfg().prefixModeEnabled === true
        },
        null,
        2
      )
    ],
    [
      "bot_settings.json",
      JSON.stringify({}, null, 2)
    ]
  ];

  for (const [name, content] of files) {
    const file =
      path.join(DATA_DIR, name);

    if (!fs.existsSync(file)) {
      await fs.writeFile(
        file,
        content
      );

      created.push(name);
    }
  }

  try {
    await ctx.answerCbQuery(
      created.length
        ? `Fixed: ${created.join(", ")}`
        : "All Files OK!",
      true
    );
  } catch {}

  return renderMain(ctx);
}

module.exports = {
  config: {
    name: "setting",
    aliases: ["settings","panel","control","st","config"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    countDown: 3,
    role: 2,
    usePrefix: true,
    description: {
            en: "Interactive bot settings panel"
        },
        category: "owner",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },

  onStart: async function ({ event, message }) {
    const uid =
      String(
        event?.senderID ||
        event?.from?.id ||
        ""
      );

    if (!isBotAdmin(uid)) {
      return message.reply(
        "❌ Only Bot Admin can open the Setting Panel."
      );
    }

    await fs.ensureDir(DATA_DIR);

    panel();
    await saveConfig();

    const botName =
      safeName(
        cfg().botInfo?.name ||
        cfg().nickNameBot ||
        "Goatbot-V2"
      );

    return message.reply(
`┌───────────⭓
│ ${botName}
├───────────
│ ⚙️ CONTROL PANEL V6.5
└───────────⭓`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "⚙️ General Settings",
                callback_data: "setting_general"
              }
            ],
            [
              {
                text: "🔐 Security & Protection",
                callback_data: "setting_security"
              }
            ],
            [
              {
                text: "💬 Message & Events",
                callback_data: "setting_message"
              }
            ],
            [
              {
                text: "🛡️ Role Manager",
                callback_data: "setting_roles_0"
              }
            ],
            [
              {
                text: "📊 System",
                callback_data: "setting_system"
              },
              {
                text: "🔄 Restart",
                callback_data: "setting_restart"
              }
            ],
            [
              {
                text: "🔧 Fix Files",
                callback_data: "setting_fixfiles"
              },
              {
                text: "🗑️ Clear Cache",
                callback_data: "setting_clearcache"
              }
            ]
          ]
        }
      }
    );
  },

  onCallback: async function ({ event, ctx }) {
    const uid =
      String(
        event?.from?.id ||
        event?.senderID ||
        ""
      );

    if (!isBotAdmin(uid)) {
      try {
        await ctx.answerCbQuery(
          "❌ Only Bot Admin",
          true
        );
      } catch {}

      return;
    }

    const data =
      String(
        event?.callbackData ||
        event?.data ||
        ""
      );

    const threadID =
      String(
        event?.threadID ||
        event?.chat?.id ||
        ctx?.chat?.id ||
        ""
      );

    try {
      await ctx.answerCbQuery();
    } catch {}

    if (data === "setting_main")
      return renderMain(ctx);

    if (data === "setting_general")
      return renderGeneral(ctx);

    if (data === "setting_security")
      return renderSecurity(ctx);

    if (data === "setting_message")
      return renderMessage(ctx, threadID);

    if (data === "setting_system")
      return renderSystem(ctx);

    if (data === "setting_noop")
      return;

    if (data.startsWith("setting_roles_")) {
      return renderRoles(
        ctx,
        threadID,
        Number(
          data.split("_").pop()
        ) || 0
      );
    }

    if (data.startsWith("setting_role_edit:")) {
      return renderRoleEdit(
        ctx,
        threadID,
        data.slice(
          "setting_role_edit:".length
        )
      );
    }

    if (data.startsWith("setting_role_save:")) {
      const parts =
        data
          .slice(
            "setting_role_save:".length
          )
          .split(":");

      const commandName =
        parts
          .slice(0, -1)
          .join(":");

      const role =
        Number(parts.at(-1));

      if (
        ![0, 1, 2].includes(role) ||
        !commandName
      ) {
        return;
      }

      try {
        await saveRole(
          threadID,
          commandName,
          role
        );

        try {
          await ctx.answerCbQuery(
            `✅ /${commandName} → Role ${role}`,
            true
          );
        } catch {}

        return renderRoles(
          ctx,
          threadID,
          0
        );
      } catch {
        try {
          await ctx.answerCbQuery(
            "❌ Role save failed.",
            true
          );
        } catch {}

        return;
      }
    }

    if (data === "setting_restart") {
      try {
        await ctx.editMessageText(
`┌───────────⭓
│ 🔄 RESTART
├───────────
│ ⏳ Restarting...
└───────────⭓`
        );
      } catch {}

      setTimeout(
        () => process.exit(2),
        1200
      );

      return;
    }

    if (data === "setting_clearcache")
      return clearCache(ctx);

    if (data === "setting_fixfiles")
      return fixFiles(ctx);

    if (data.startsWith("setting_toggle_")) {
      const key =
        data.slice(
          "setting_toggle_".length
        );

      const c = cfg();
      const p = panel();

      if (key === "prefix") {
        c.prefixModeEnabled =
          c.prefixModeEnabled !== true;

        const file =
          path.join(
            DATA_DIR,
            "prefixmode.json"
          );

        await fs.ensureDir(DATA_DIR);

        await fs.writeJson(
          file,
          {
            enabled:
              c.prefixModeEnabled
          },
          {
            spaces: 2
          }
        );

        await saveConfig();

        return renderGeneral(ctx);
      }

      if (key === "adminonly") {
        c.adminOnly =
          c.adminOnly || {
            enable: false,
            ignoreCommand: []
          };

        c.adminOnly.enable =
          c.adminOnly.enable !== true;

        await saveConfig();

        return renderGeneral(ctx);
      }

      if (key === "whitelist") {
        c.whiteListMode =
          c.whiteListMode || {
            enable: false,
            whiteListIds: []
          };

        c.whiteListMode.enable =
          c.whiteListMode.enable !== true;

        await saveConfig();

        return renderGeneral(ctx);
      }

      if (key === "whitelistthread") {
        c.whiteListModeThread =
          c.whiteListModeThread || {
            enable: false,
            whiteListThreadIds: []
          };

        c.whiteListModeThread.enable =
          c.whiteListModeThread.enable !== true;

        await saveConfig();

        return renderGeneral(ctx);
      }

      if (key === "maintenance")
        p.maintenance = !p.maintenance;

      else if (key === "antilink")
        p.antilink = !p.antilink;

      else if (key === "spammute")
        p.spammute = !p.spammute;

      else if (key === "cooldown")
        p.cooldown = !p.cooldown;

      await saveConfig();

      return renderSecurity(ctx);
    }

    if (
      data === "setting_toggle_welcome" ||
      data === "setting_toggle_leave"
    ) {
      const settings =
        await getThreadSettings(threadID);

      const key =
        data === "setting_toggle_welcome"
          ? "sendWelcomeMessage"
          : "sendLeaveMessage";

      const ok =
        await setThreadSetting(
          threadID,
          key,
          settings[key] === false
        );

      try {
        await ctx.answerCbQuery(
          ok
            ? `✅ ${
                key === "sendWelcomeMessage"
                  ? "Welcome"
                  : "Leave"
              } ${
                settings[key] === false
                  ? "ON"
                  : "OFF"
              }`
            : "❌ Save failed",
          true
        );
      } catch {}

      return renderMessage(
        ctx,
        threadID
      );
    }
  }
};