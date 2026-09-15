const fs = require("fs-extra");
const path = require("path");
const nullAndUndefined = [undefined, null];
const languageModuleCache = new Map();
let prefixModeFileState = false;
try {
	const prefixModePath = path.join(process.cwd(), "scripts/cmds/Siddik/prefixmode.json");
	if (fs.existsSync(prefixModePath))
		prefixModeFileState = JSON.parse(fs.readFileSync(prefixModePath, "utf8"))?.enabled === true;
} catch (_) {}
if (prefixModeFileState && global.GoatBot?.config)
	global.GoatBot.config.prefixModeEnabled = true;
// ———————————————— TYPE SYSTEM ———————————————— //
 
function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}
// ———————————————— ROLE SYSTEM ———————————————— //
 
function getRole(threadData, senderID) {
	const adminBot = (global.GoatBot.config.adminBot || []).map(String);
	if (senderID === undefined || senderID === null)
		return 0;
	const id = String(senderID);
	if (adminBot.includes(id))
		return 2;
	const adminBox = threadData?.adminIDs || [];
	const isThreadAdmin = adminBox.some((item) => {
		if (item && typeof item === "object")
			return String(item.id ?? item.userID ?? "") === id;
		return String(item) === id;
	});
	return isThreadAdmin ? 1 : 0;
}
// ———————————————— TEXT SYSTEM ———————————————— //
 
function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned")
		return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot")
		return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}
// ———————————————— SHORTCUT SYSTEM ———————————————— //
 
function replaceShortcutInLang(text, prefix, commandName) {
	return String(text ?? '')
		.replace(/\{(?:p|prefix)\}/g, String(prefix ?? ''))
		.replace(/\{(?:n|name)\}/g, String(commandName ?? ''))
		.replace(/\{pn\}/g, `${prefix ?? ''}${commandName ?? ''}`);
}
// ———————————————— LANGUAGE MODULE ———————————————— //
 
function getLanguageModule(filePath, fallbackPath) {
	for (const candidate of [filePath, fallbackPath]) {
		if (!candidate || !fs.existsSync(candidate))
			continue;
		if (languageModuleCache.has(candidate))
			return languageModuleCache.get(candidate);
		try {
			const mod = require(candidate);
			languageModuleCache.set(candidate, mod);
			return mod;
		}
		catch (_) {}
	}
	return {};
}
// ———————————————— LANGUAGE RESOLVER ———————————————— //
 
function resolveLocalizedValue(value, langCode) {
	if (typeof value === 'string' || typeof value === 'number')
		return String(value);
	if (value && typeof value === 'object' && !Array.isArray(value))
		return value[langCode] ?? value.en ?? value.vi ?? Object.values(value)[0] ?? '';
	return '';
}
// ———————————————— LANGUAGE FORMAT ———————————————— //
 
function formatLangText(value, prefix, commandName, args = []) {
	let text = replaceShortcutInLang(value, prefix, commandName);
	return text.replace(/%([1-9]\d*)/g, (match, n) => {
		const index = Number(n) - 1;
		return index >= 0 && index < args.length ? String(args[index] ?? '') : match;
	});
}
// ———————————————— ROLE CONFIG ———————————————— //
 
function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) {
		roleConfig = {
			onStart: command.config.role
		};
	}
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart)
			command.config.role.onStart = 0;
		roleConfig = command.config.role;
	}
	else {
		roleConfig = {
			onStart: 0
		};
	}
	if (isGroup)
		roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;
	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		if (roleConfig[key] == undefined)
			roleConfig[key] = roleConfig.onStart;
	}
	return roleConfig;
}
// ———————————————— SECURITY CHECK ———————————————— //
 
function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang, options = {}) {
	const silent = options.silent === true;
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage } = config;
	const panel = config.settingPanel || {};
	const adminIds = (adminBot || []).map(String);
	const isBotAdmin = adminIds.includes(String(senderID));
	if (panel.onlyBotAdmin === true && !isBotAdmin) {
		if (!silent) message.reply("🔒 Only Bot Admin can use this bot right now.");
		return true;
	}
	if (panel.maintenance === true && !isBotAdmin) {
		if (!silent) message.reply("🚧 Bot is currently under maintenance. Please try again later.");
		return true;
	}
	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) {
		const { reason, date } = infoBannedUser;
		if (!silent && hideNotiMessage.userBanned == false)
			message.reply(getText("userBanned", reason, date, senderID, lang));
		return true;
	}
	if (
		config.adminOnly.enable == true
		&& !isBotAdmin
		&& !config.adminOnly.ignoreCommand.includes(commandName)
	) {
		if (!silent && hideNotiMessage.adminOnly == false)
			message.reply(getText("onlyAdminBot", null, null, null, lang));
		return true;
	}
	if (isGroup == true) {
		if (
			threadData.data.onlyAdminBox === true
			&& !(threadData.adminIDs || []).some(item => String(item && typeof item === "object" ? (item.id ?? item.userID ?? "") : item) === String(senderID))
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			if (!silent && !threadData.data.hideNotiMessageOnlyAdminBox)
				message.reply(getText("onlyAdminBox", null, null, null, lang));
			return true;
		}
		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) {
			if (isBotAdmin) return false;

			const { reason, date } = infoBannedThread;
			if (!silent && hideNotiMessage.threadBanned == false)
				message.reply(getText("threadBanned", reason, date, threadID, lang));
			return true;
		}
	}
	return false;
}
// ———————————————— COMMAND LANGUAGE ———————————————— //
 
function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	const fallbackLangPath = path.normalize(`${process.cwd()}/languages/cmds/en.js`);
	const languageModule = getLanguageModule(pathCustomLang, fallbackLangPath);
	function getLanguageSection(code) {
		const direct = command.langs?.[code];
		if (direct) return direct;
		const fallback = command.langs?.en;
		return fallback || {};
	}
	return function getLang(key, ...args) {
		let value = getLanguageSection(langCode)?.[key];
		if (value === undefined) value = getLanguageSection('en')?.[key];
		const externalCommand = languageModule?.[commandName] || {};
		if (value === undefined) value = externalCommand?.text?.[key];
		if (value === undefined) value = externalCommand?.[key];
		const resolved = resolveLocalizedValue(value, langCode);
		if (!resolved)
			return `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		return formatLangText(resolved, prefix, commandName, args);
	};
}
// ———————————————— TELEGRAM CONTEXT ———————————————— //
 
function createTelegramContext(api, event) {
  const msg = event.raw || event.message || {};
  const chatId = event.threadID || msg.chat?.id || event.chat?.id;
  const messageId = event.messageID || msg.message_id || event.message?.message_id;
  return {
    update: event.rawUpdate || event.raw || event,
    message: msg,
    from: event.from || msg.from || {},
    chat: event.chat || msg.chat || {},
    botInfo: api.botInfo,
    telegram: api,
    reply: (text, opts = {}) => api.sendMessage(text, chatId, opts),
    editMessageText: (text, opts = {}) => api.editMessageText(chatId, messageId, text, opts),
    editMessageCaption: (caption, opts = {}) => api.editMessageCaption(chatId, messageId, caption, opts),
    deleteMessage: () => api.deleteMessage(chatId, messageId),
    answerCbQuery: (text = "", showAlert = false) => api.answerCallbackQuery(event.callbackQueryID, text, showAlert),
    sendMessage: (text, opts = {}) => api.sendMessage(text, chatId, opts),
    sendPhoto: (photo, opts = {}) => api.sendPhoto(chatId, photo, opts),
    sendDocument: (doc, opts = {}) => api.sendDocument(chatId, doc, opts),
    sendVideo: (video, opts = {}) => api.sendVideo(chatId, video, opts),
    sendAudio: (audio, opts = {}) => api.sendAudio(chatId, audio, opts),
    sendAttachment: (form, cb) => api.sendMessage(form, chatId, cb),
    chatId, threadID: chatId, userId: event.userID || event.senderID, userID: event.userID || event.senderID
  };
}
// ———————————————— HANDLER SYSTEM ———————————————— //
 
module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	global.onCallback = global.onCallback || new Map();
	return async function (event, message) {
		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const autoRefreshThreadInfoFirstTime = config.database.autoRefreshThreadInfoFirstTime !== false;
		let { hideNotiMessage = {} } = config;
		const rawChatID = event.raw?.chat?.id ?? event.message?.chat?.id ?? event.chat?.id;
		if (rawChatID !== undefined && rawChatID !== null) event.threadID = String(rawChatID);
		const { body, messageID, threadID, isGroup } = event;
		if (!threadID)
			return;
		if (event.type === "event" && (event.logMessageType === "log:subscribe" || event.logMessageType === "log:unsubscribe")) {
			global.temp.telegramEventDedupe = global.temp.telegramEventDedupe || new Map();
			const participant = event.logMessageType === "log:subscribe"
				? (event.logMessageData?.addedParticipants || []).map(p => String(p?.userFbId || p?.id || "")).filter(Boolean).sort().join(",")
				: String(event.logMessageData?.leftParticipantFbId || event.left_chat_member?.id || "");
			const dedupeKey = `${String(threadID)}:${event.logMessageType}:${participant}`;
			const now = Date.now();
			const previous = global.temp.telegramEventDedupe.get(dedupeKey) || 0;
			if (now - previous < 5000) return;
			global.temp.telegramEventDedupe.set(dedupeKey, now);
			for (const [key, time] of global.temp.telegramEventDedupe) {
				if (now - time > 10000) global.temp.telegramEventDedupe.delete(key);
			}
		}
		const senderID = event.userID || event.senderID || event.author;
		const panelSettings = config.settingPanel || {};
		const botAdminsForPanel = (config.adminBot || []).map(String);
		const panelIsAdmin = botAdminsForPanel.includes(String(senderID));
		if (!panelIsAdmin && typeof body === "string") {
			if (panelSettings.antilink === true && /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/)/i.test(body)) {
				try { await api.deleteMessage?.(threadID, messageID); } catch (_) {}
				try { await message.reply("🔗 Anti Link is ON. Links are not allowed."); } catch (_) {}
				return;
			}
			if (panelSettings.spammute === true || panelSettings.spamMuteGlobal === true) {
				global.temp.settingSpam = global.temp.settingSpam || new Map();
				const now = Date.now();
				const key = `${threadID}:${senderID}`;
				const spamKey = panelSettings.spamMuteGlobal === true ? `global:${senderID}` : key;
				const history = (global.temp.settingSpam.get(spamKey) || []).filter(t => now - t < 5000);
				history.push(now);
				global.temp.settingSpam.set(spamKey, history);
				if (history.length > 5) {
					try { await api.deleteMessage?.(threadID, messageID); } catch (_) {}
					try { await message.reply("🚫 Spam protection is ON. Please slow down."); } catch (_) {}
					return;
				}
			}
		}
		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);
		if (!userData && !isNaN(senderID)) {
			try {
				userData = await usersData.create(senderID);
			} catch (err) {
				userData = { userID: String(senderID), name: event.from?.first_name || event.from?.username || "Unknown", banned: { status: false }, data: {} };
			}
		}
		if (!threadData && !isNaN(threadID)) {
			if (!global.temp.createThreadDataError.includes(threadID)) {
				try {
					threadData = await threadsData.create(threadID);
					global.db.receivedTheFirstMessage[threadID] = true;
				} catch (err) {
					if (event.type !== "event") {
						global.temp.createThreadDataError.push(threadID);
						throw err;
					}
				}
			}
		}
		if (!threadData && event.type === "event") {
			threadData = {
				threadID: String(threadID),
				threadName: event.chat?.title || event.raw?.chat?.title || "Group",
				name: event.chat?.title || event.raw?.chat?.title || "Group",
				adminIDs: [],
				settings: {},
				data: { lang: config.language || "en" },
				banned: { status: false }
			};
		}
		else if (threadData) {
			if (autoRefreshThreadInfoFirstTime === true && !global.db.receivedTheFirstMessage[threadID]) {
				global.db.receivedTheFirstMessage[threadID] = true;
				Promise.resolve(threadsData.refreshInfo(threadID)).catch(err => {
					log.err("DATABASE", `Background thread refresh failed for ${threadID}`, err);
				});
			}
		}
		if (typeof threadData.settings.hideNotiMessage == "object")
			hideNotiMessage = threadData.settings.hideNotiMessage;
		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const telegramCtx = event.ctx || createTelegramContext(api, event);
		const parameters = {
			api, bot: api, usersData, threadsData, message, event,
			db: global.db,
			msg: event.raw || event.message || event,
			ctx: telegramCtx,
			chatId: String(threadID),
			userId: senderID,
			threadID,
			userID: senderID,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					throw new Error("Please provide body, prefix and commandName to use this function, this function without parameters only support for onStart");
				for (let i = 0; i < arguments.length; i++)
					if (typeof arguments[i] != "string")
						throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);
				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";
		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}
		let isUserCallCommand = false;
		let securityNoticeSent = false;
		// ———————————————— COMMAND LOGGER ———————————————— //
		function logSuccessfulCommand(commandName) {
			const senderName = userData?.name || event.senderName || event.from?.first_name || event.from?.username || "Unknown";
			const chatID = String(threadID ?? event.chat?.id ?? event.raw?.chat?.id ?? "Unknown");
			const groupName = threadData?.name || threadData?.threadName || event.threadName || event.chat?.title || event.raw?.chat?.title || "Unknown";
			const messageText = String(body || "No text").trim();
			const logTime = new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
			const line = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
			if (isGroup === true || chatID.startsWith("-")) {
				console.log(`${line}\nGROUP CHAT MESSAGE\n${line}\n» From: ${senderName}\n» UID: ${senderID}\n» Group Name: ${groupName}\n» Chat ID: ${chatID}\n🔖 Message: ${messageText}\n» Command: ${commandName}\n» Time: ${logTime}\n${line}`);
			} else {
				console.log(`${line}\nPRIVATE CHAT MESSAGE\n${line}\n» From: ${senderName}\n» UID: ${senderID}\n» INBOX: ${senderName}\n» Chat ID: ${chatID}\n🔖 Message: ${messageText}\n» Command: ${commandName}\n» Time: ${logTime}\n${line}`);
			}			
		}
		// ———————————————— CHECK COMMAND ———————————————— //
 
async function onStart() {
			if (!body || typeof body !== "string")
				return;
			const dateNow = Date.now();
			const prefixMode = GoatBot.config.prefixModeEnabled === true;
			const trimmedBody = body.trim();
			let commandText = null;
			let usedPrefix = false;
			if (trimmedBody.startsWith(prefix)) {
				commandText = trimmedBody.slice(prefix.length).trim();
				usedPrefix = true;
			}
			else if (prefixMode) {
				const first = trimmedBody.split(/\s+/)[0].toLowerCase();
				const candidate = GoatBot.commands.get(first) || GoatBot.commands.get(GoatBot.aliases.get(first));
				if (candidate) commandText = trimmedBody;
			}
			else {
				const first = trimmedBody.split(/\s+/)[0].toLowerCase();
				const candidate = GoatBot.commands.get(first) || GoatBot.commands.get(GoatBot.aliases.get(first));
				if (candidate?.config?.usePrefix === false) commandText = trimmedBody;
			}
			if (!commandText || trimmedBody === prefix) return;
			const args = commandText.split(/ +/);
			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			if (command && !usedPrefix && !prefixMode && command.config?.usePrefix !== false)
             return;
			const aliasesData = threadData.data.aliases || {};
			for (const cmdName in aliasesData) {
				if (aliasesData[cmdName].includes(commandName)) {
					command = GoatBot.commands.get(cmdName);
					break;
				}
			}
			if (command)
				commandName = command.config.name;
			function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if (arguments.length) {
					if (typeof body_ != "string")
						throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
					if (typeof prefix_ != "string")
						throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
					if (typeof commandName_ != "string")
						throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);
					return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				else {
					return body.replace(new RegExp(`^${prefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}
			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode, { silent: securityNoticeSent })) {
				securityNoticeSent = true;
				return;
			}
			if (!command)
				if (!hideNotiMessage.commandNotFound)
					return await message.reply(
						commandName ?
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix) :
							utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix)
					);
				else
					return true;
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onStart;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmd) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
					else if (needRole >= 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
				}
				else {
					return true;
				}
			}
			if (!client.countDown[commandName])
				client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown;
			if (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
				getCoolDown = 1;
			const cooldownCommand = getCoolDown * 1000;
			if (timestamps[senderID]) {
				const expirationTime = timestamps[senderID] + cooldownCommand;
				if (dateNow < expirationTime)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			isUserCallCommand = true;
			try {
				(async () => {
					const analytics = await globalData.get("analytics", "data", {});
					if (!analytics[commandName])
						analytics[commandName] = 0;
					analytics[commandName]++;
					await globalData.set("analytics", analytics, "data");
				})();
				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const startHandler = command.onStart;
				if (typeof startHandler !== "function")
					return;
				await startHandler.call(command, {
					...parameters,
					args,
					commandName,
					getLang: getText2,
					removeCommandNameFromBody
				});
				timestamps[senderID] = dateNow;
				logSuccessfulCommand(commandName);
			}
			catch (err) {
				log.err("CALL Cmd error", `${commandName} | ${userData?.name || "Unknown"} | ${senderID} | ${threadID} | ${args.join(" ")}`);
				log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}
		// ———————————————— ONCHAT SYSTEM ———————————————— //
 
async function onChat() {
			const allOnChat = GoatBot.onChat || [];
			const args = body ? body.split(/ +/) : [];
			const tasks = [];
			for (const key of new Set(allOnChat)) {
				const command = GoatBot.commands.get(key);
				if (!command) continue;
				const commandName = command.config.name;
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				if (roleConfig.onChat > role) continue;
				const getText2 = createGetText2(langCode, `\( {process.cwd()}/languages/cmds/ \){langCode}.js`, prefix, command);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode, { silent: securityNoticeSent || !isUserCallCommand })) {
					securityNoticeSent = true;
					continue;
				}
				tasks.push((async () => {
					try {
						const handler = await command.onChat.call(command, {
							...parameters, isUserCallCommand, args, commandName, getLang: getText2
						});
						if (typeof handler === "function") await handler();
					} catch (err) {
						log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
						try {
							await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
						} catch (_) {}
					}
				})());
			}
			await Promise.allSettled(tasks);
		}
		// ———————————————— ON REPLY ———————————————— //
 
async function onReply() {
			if (!event.messageReply)
				return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply)
				return;
			Reply.delete = () => onReply.delete(messageID);
			const commandName = Reply.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReply;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReply) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
					else if (needRole >= 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
				}
				else {
					return true;
				}
			}
			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const args = body ? body.split(/ +/) : [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode, { silent: securityNoticeSent })) {
					securityNoticeSent = true;
					return;
				}
				const replyHandler = command.onReply;
				if (typeof replyHandler !== "function")
					return;
				await replyHandler.call(command, {
					...parameters,
					Reply,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			catch (err) {
				log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}
		// ———————————————— ON REACTION ———————————————— //
 
async function onReaction() {
			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction)
				return;
			Reaction.delete = () => onReaction.delete(messageID);
			const commandName = Reaction.commandName;
			if (!commandName) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			const needRole = roleConfig.onReaction;
			if (needRole > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					if (needRole == 1)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
					else if (needRole >= 2)
						return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReaction", commandName));
				}
				else {
					return true;
				}
			}
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				if (!command)
					throw new Error(`Cannot find command with commandName: ${commandName}`);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				const args = [];
				createMessageSyntaxError(commandName);
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode, { silent: securityNoticeSent })) {
					securityNoticeSent = true;
					return;
				}
				await command.onReaction({
					...parameters,
					Reaction,
					args,
					commandName,
					getLang: getText2
				});
				log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
			}
			catch (err) {
				log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}
		// ———————————————— EVENT COMMAND ———————————————— //
 
async function handlerEvent() {
			const { author } = event;
			const allEventCommand = GoatBot.eventCommands.entries();
			for (const [key] of allEventCommand) {
				const getEvent = GoatBot.eventCommands.get(key);
				if (!getEvent)
					continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				try {
					const handler = await getEvent.onStart({
						...parameters,
						commandName,
						getLang: getText2
					});
					if (typeof handler == "function") {
						await handler();
						log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
					}
				}
				catch (err) {
					log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
					await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
				}
			}
		}
		// ———————————————— ON EVENT ———————————————— //
 
async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			const args = [];
			const { author } = event;
			for (const key of allOnEvent) {
				if (typeof key !== "string")
					continue;
				const command = GoatBot.commands.get(key);
				if (!command)
					continue;
				const commandName = command.config.name;
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				createMessageSyntaxError(commandName);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);
				if (getType(command.onEvent) == "Function") {
					const defaultOnEvent = command.onEvent;
					command.onEvent = async function () {
						return defaultOnEvent(...arguments);
					};
				}
				command.onEvent({
					...parameters,
					args,
					commandName,
					getLang: getText2
				})
					.then(async (handler) => {
						if (typeof handler == "function") {
							try {
								await handler();
								log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
							}
							catch (err) {
								message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, removeHomeDir(err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
					});
			}
		}
		// ———————————————— PRESENCE ———————————————— //
 
async function presence() {
		}
		// ———————————————— READ RECEIPT ———————————————— //
 
async function read_receipt() {
		}
		// ———————————————— TYPING ———————————————— //
 
async function typ() {
		}
		return {
			onChat,
			onStart,
			onReaction,
			onReply,
			onEvent,
			handlerEvent
		};
	};
};
 
