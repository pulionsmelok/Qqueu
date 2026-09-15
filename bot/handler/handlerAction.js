const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");
const request = require("request");
const axios = require("axios");
const fs = require("fs-extra");
// —————————————————— COMMAND RESOLVE SYSTEM —————————————————— //

function resolveCommandFromData(data, event) {
	global.onCallback = global.onCallback || new Map();
	let parts = [];
	let commandName = "";
	let command = null;
	if (data.startsWith("button:")) {
		parts = data.slice(7).split(":");
		commandName = (parts.shift() || "").toLowerCase();
	} else {
		parts = data.split(":");
		commandName = (parts[0] || "").toLowerCase();
	}
	command = global.GoatBot.commands.get(commandName)
		|| global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
	if (!command) {
		const stored = global.onCallback.get(data)
			|| global.onCallback.get(event.messageID)
			|| global.GoatBot?.onCallback?.get?.(event.messageID)
			|| global.onCallback.get(`reply:${data}`);
		if (stored?.commandName) {
			commandName = String(stored.commandName).toLowerCase();
			command = global.GoatBot.commands.get(commandName)
				|| global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
			parts = data.includes(":") ? data.split(":").slice(1) : [data];
		}
	}
	if (!command) {
		for (const candidate of global.GoatBot.commands.values()) {
			if (typeof candidate?.onCallback !== "function" && typeof candidate?.onButton !== "function") continue;
			const n = String(candidate.config?.name || "").toLowerCase();
			const aliases = (candidate.config?.aliases || []).map(a => String(a).toLowerCase());
			if (
				data === n || data.startsWith(n + "_") || data.startsWith(n + ":") ||
				aliases.some(a => data === a || data.startsWith(a + "_") || data.startsWith(a + ":"))
			) {
				command = candidate;
				commandName = candidate.config.name;
				if (data.startsWith(n + "_")) parts = data.slice(n.length + 1).split("_");
				else if (data.startsWith(n + ":")) parts = data.slice(n.length + 1).split(":");
				else {
					const matchedAlias = aliases.find(a => data.startsWith(a + "_") || data.startsWith(a + ":"));
					if (matchedAlias) {
						const sep = data[matchedAlias.length];
						parts = data.slice(matchedAlias.length + 1).split(sep === "_" ? "_" : ":");
					} else parts = [];
				}
				break;
			}
		}
	}
	return { command, commandName, parts };
}
// —————————————————— CALLBACK CONTEXT SYSTEM —————————————————— //

function buildCallbackCtx(api, event) {
	return event.ctx || {
		telegram: api, bot: api, api,
		message: event.message || event.callbackMessage || {},
		from: event.from || {},
		chat: event.chat || event.message?.chat || {},
		botInfo: api.botInfo,
		reply: (text, opts = {}) => api.sendMessage(text, event.threadID, opts),
		editMessageText: (text, opts = {}) => api.editMessageText(event.threadID, event.messageID, text, opts),
		editMessageCaption: (caption, opts = {}) => api.editMessageCaption(event.threadID, event.messageID, caption, opts),
		deleteMessage: () => api.deleteMessage(event.threadID, event.messageID),
		answerCbQuery: (text = "", showAlert = false) => {
			if (event.callbackQueryID) return api.answerCallbackQuery(event.callbackQueryID, text, showAlert);
		}
	};
}

async function runOnCallback(api, event, command, commandName, parts, data) {
	const callbackCtx = buildCallbackCtx(api, event);
	const payload = {
		api, bot: api, event, ctx: callbackCtx,
		message: createFuncMessage(api, event),
		args: parts,
		commandName: command.config?.name || commandName,
		data, chatId: event.threadID, threadID: event.threadID,
		userId: event.senderID || event.userID,
		userID: event.senderID || event.userID
	};
	if (typeof command.onCallback === "function") await command.onCallback(payload);
	else if (typeof command.onButton === "function") await command.onButton(payload);
}
// —————————————————— MAIN ACTION HANDLER —————————————————— //

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == "development" ? "./handlerEvents.dev.js" : "./handlerEvents.js")(
		api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData
	);
	return async function handlerAction(event) {
		const message = createFuncMessage(api, event);
		// —————————————————— DATABASE CHECK SYSTEM —————————————————— //
		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat) return;
		const { onStart, onChat, onReply, onEvent, handlerEvent, onReaction } = handlerChat;
		// —————————————————— EVENT TYPE ROUTER —————————————————— //
		switch (event.type) {
			case "callback_query": {
				try { await api.answerCallbackQuery?.(event.callbackQueryID, ""); } catch (_) {}
				const data = String(event.callbackData || event.data || "").trim();
				if (!data) return;
				global.onCallback = global.onCallback || new Map();
				if (data.startsWith("cmd:")) {
					const commandText = data.slice(4).trim();
					const prefix = global.utils.getPrefix(event.threadID);
					await handlerAction({
						...event, type: "message", body: prefix + commandText,
						raw: event.raw?.message || event.raw, isReply: false
					});
					return;
				}
				const { command, commandName, parts } = resolveCommandFromData(data, event);
				if (!command) return;
				await runOnCallback(api, event, command, commandName, parts, data);
				return;
			}
			case "message":
			case "message_reply":
			case "message_unsend": {
				if (event.type === "message" || event.type === "message_reply") {
					const body = String(event.body || "").trim();
					if (body) {
						global.onCallback = global.onCallback || new Map();
						const stored = global.onCallback.get(body)
							|| global.onCallback.get(`reply:${body}`)
							|| global.onCallback.get(`rk:${body}`);
						if (stored && stored.commandName) {
							const commandName = String(stored.commandName).toLowerCase();
							const command = global.GoatBot.commands.get(commandName)
								|| global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
							if (command && (typeof command.onCallback === "function" || typeof command.onButton === "function")) {
								const data = stored.data || body;
								const parts = Array.isArray(stored.args) ? stored.args : (data.includes(":") ? data.split(":").slice(1) : []);
								event.isReplyKeyboard = true;
								event.callbackData = data;
								event.data = data;
								await runOnCallback(api, event, command, commandName, parts, data);
								if (stored.once === true) {
									global.onCallback.delete(body);
									global.onCallback.delete(`reply:${body}`);
									global.onCallback.delete(`rk:${body}`);
								}
								return;
							}
						}
					}
				}
				// Keep onStart awaited (normal commands). Make onReply/onChat non-blocking
				// so long AI replies no longer freeze other commands / show long "Waiting..."
				await onStart();
				void Promise.allSettled([onReply()]);
				void Promise.allSettled([onChat()]);
				// —————————————————— UNSEND SYSTEM —————————————————— //
				if (event.type === "message_unsend") {
					const resend = await threadsData.get(event.threadID, "settings.reSend");
					const resendStore = global.reSend?.[event.threadID];
					if (resend === true && event.senderID !== api.getCurrentUserID() && Array.isArray(resendStore)) {
						const umid = resendStore.findIndex(e => e?.messageID === event.messageID);
						if (umid > -1) {
							const nname = await usersData.getName(event.senderID);
							const attch = [];
							const attachments = Array.isArray(resendStore[umid]?.attachments) ? resendStore[umid].attachments : [];
							let cn = 0;
							for (const abc of attachments) {
								if (!abc?.url) continue;
								if (abc.type === "audio") {
									cn += 1;
									const pts = `scripts/cmds/tmp/${cn}.mp3`;
									const res2 = (await axios.get(abc.url, { responseType: "arraybuffer" })).data;
									fs.ensureDirSync("scripts/cmds/tmp");
									fs.writeFileSync(pts, Buffer.from(res2));
									attch.push(fs.createReadStream(pts));
								} else attch.push(await global.utils.getStreamFromURL(abc.url));
							}
							await api.sendMessage({
								body: `${nname} removed:\n\n${resendStore[umid]?.body || ""}`,
								mentions: [{ id: event.senderID, tag: nname }],
								attachment: attch
							}, event.threadID);
						}
					}
				}
				break;
			}
			case "event":
				handlerEvent();
				onEvent();
				break;
			// —————————————————— REACTION SECURITY SYSTEM —————————————————— //
			case "message_reaction": {
				onReaction();
				if (event.reaction !== "👍") break;
				const ADMIN_UID = "6734899387";
				const reactorID = String(event.userID ?? event.senderID ?? "");
				if (reactorID !== ADMIN_UID) break;
				try {
					const botID = String(api.getCurrentUserID());
					const messageID = String(event.messageID);
					const target = api.messageCache?.get(`${event.threadID}:${messageID}`);
					const targetAuthor = String(target?.from?.id ?? target?.sender_chat?.id ?? "");
					const isBotMessage = targetAuthor === botID ||
						(target?.messageID && String(target.messageID) === messageID && !targetAuthor &&
						 api.messageCache?.has(`${event.threadID}:${messageID}`));
					if (!isBotMessage) break;
					if (event.isGroup) {
						const me = await api.call("getChatMember", {
							chat_id: event.threadID, user_id: Number(botID)
						});
						const canDelete = me?.status === "creator" ||
							(me?.status === "administrator" && me?.can_delete_messages === true);
						if (!canDelete) break;
					}
					await api.unsendMessage(messageID);
				} catch (err) {
					// —————————————————— ERROR HANDLER —————————————————— //
					console.log(`[REACT_UNSEND] ${err?.message || err}`);
				}
				break;
			}
			case "typ": typ(); break;
			case "presence": presence(); break;
			case "read_receipt": read_receipt(); break;
			default: break;
		}
	};
};
