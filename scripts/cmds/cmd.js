const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;
const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

function getDomain(url) {
	const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im);
	return match ? match[1] : null;
}

function safeFileName(fileName) {
	fileName = path.basename(String(fileName || "").trim());
	return /^[a-zA-Z0-9._-]+\.js$/i.test(fileName) ? fileName : null;
}

function normalizeCommandFileName(fileName) {
	let raw = path.basename(String(fileName || "").trim());
	if (!raw) return null;
	if (!/\.js$/i.test(raw)) raw += ".js";
	return safeFileName(raw);
}

function commandBaseName(fileName) {
	const normalized = normalizeCommandFileName(fileName);
	return normalized ? normalized.slice(0, -3) : null;
}

function getTelegramDocument(event) {
	const msg = event?.message || event?.raw || event || {};
	return msg.document || msg.reply_to_message?.document || event?.messageReply?.message?.document || event?.messageReply?.document || event?.raw?.document || null;
}

function getTelegramBot(api) {
	if (api && typeof api.getFileLink === "function") return api;
	return api?.bot || global.GoatBot?.telegramApi || global.GoatBot?.api || global.GoatBot?.bot || global.GoatBot?.telegram || global.telegramBot || global.bot;
}

async function downloadTelegramDocument(event, api) {
	const doc = getTelegramDocument(event);
	if (!doc?.file_id) throw new Error("Telegram document not found");
	const bot = getTelegramBot(api);
	if (!bot || typeof bot.getFileLink !== "function") throw new Error("Telegram Bot API is not available");
	const fileName = safeFileName(doc.file_name || "command.js");
	if (!fileName) throw new Error("Invalid JavaScript file name");
	if (!fileName.toLowerCase().endsWith(".js")) throw new Error("Only .js files are allowed");
	const url = await bot.getFileLink(doc.file_id);
	const response = await axios.get(url, { responseType: "arraybuffer", maxContentLength: 10 * 1024 * 1024 });
	return { fileName, rawCode: Buffer.from(response.data).toString("utf8") };
}

function commandPath(fileName) {
	const safe = safeFileName(fileName);
	if (!safe) throw new Error("Invalid command file name");
	return path.join(__dirname, safe);
}

function commandButtons(fileName, userID) {
	return {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "🔄 | Replace", callback_data: `cmd_replace_${userID}_${fileName}` },
					{ text: "✏ | Rename", callback_data: `cmd_rename_${userID}_${fileName}` }
				],
				[
					{ text: "❌ | Cancel", callback_data: `cmd_cancel_${userID}_${fileName}` }
				]
			]
		}
	};
}

function isURL(str) {
	try { new URL(str); return true; } catch (e) { return false; }
}

module.exports = {
	config: {
    name: "cmd",
		aliases: [],
		version: "1.5.0",
		author: "SK-SIDDIK-KHAN",
		countDown: 5,
		role: 2,
		usePrefix: true,
    description: {
            vi: "Quản lý các tệp lệnh của bạn",
            en: "Manage your command files",
            bn: "Manage আপনার কমান্ড ফাইলগুলো"
        },
        category: "owner",
        guide: {
            vi: " {pn} load <tên file lệnh>\n {pn} loadAll\n {pn} install <url> <tên file lệnh>\n {pn} install <tên file lệnh> <code>",
            en: " {pn} load <command file name>\n {pn} loadAll\n {pn} install <url> <command file name>\n {pn} install <command file name> <code>",
            bn: " {pn} load <কমান্ড ফাইল নাম>\n {pn} loadAll\n {pn} install <url> <কমান্ড ফাইল নাম>\n {pn} install <কমান্ড ফাইল নাম> <code>"
        }
},
	langs: {
		vi: {
			missingFileName: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn reload",
			loaded: "✅ | Đã load command \"%1\" thành công",
			loadedError: "❌ | Load command \"%1\" thất bại với lỗi\n%2: %3",
			loadedSuccess: "✅ | Đã load thành công (%1) command",
			loadedFail: "❌ | Load thất bại (%1) command\n%2",
			openConsoleToSeeError: "👀 | Hãy mở console để xem chi tiết lỗi",
			missingCommandNameUnload: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn unload",
			unloaded: "✅ | Đã unload command \"%1\" thành công",
			unloadedError: "❌ | Unload command \"%1\" thất bại với lỗi\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Vui lòng nhập vào url hoặc code và tên file lệnh bạn muốn cài đặt",
			missingUrlOrCode: "⚠️ | Vui lòng nhập vào url hoặc code của tệp lệnh bạn muốn cài đặt",
			missingFileNameInstall: "⚠️ | Vui lòng nhập vào tên file để lưu lệnh (đuôi .js)",
			invalidUrl: "⚠️ | Vui lòng nhập vào url hợp lệ",
			invalidUrlOrCode: "⚠️ | Không thể lấy được mã lệnh",
			alreadExist: "⚠️ | File lệnh đã tồn tại, bạn có chắc chắn muốn ghi đè lên file lệnh cũ không?",
			installed: "✅ | Đã cài đặt command \"%1\" thành công, file lệnh được lưu tại %2",
			installedError: "❌ | Cài đặt command \"%1\" thất bại với lỗi\n%2: %3",
			missingFile: "⚠️ | Không tìm thấy tệp lệnh \"%1\"",
			invalidFileName: "⚠️ | Tên tệp lệnh không hợp lệ",
			unloadedFile: "✅ | Đã unload lệnh \"%1\""
		},
		en: {
			missingFileName: "⚠️ | Please enter the command name you want to reload",
			loaded: "✅ | Loaded command \"%1\" successfully",
			loadedError: "❌ | Failed to load command \"%1\" with error\n%2: %3",
			loadedSuccess: "✅ | Loaded successfully (%1) command",
			loadedFail: "❌ | Failed to load (%1) command\n%2",
			openConsoleToSeeError: "👀 | Open console to see error details",
			missingCommandNameUnload: "⚠️ | Please enter the command name you want to unload",
			unloaded: "✅ | Unloaded command \"%1\" successfully",
			unloadedError: "❌ | Failed to unload command \"%1\" with error\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Please enter the url or code and command file name you want to install",
			missingUrlOrCode: "⚠️ | Please enter the url or code of the command file you want to install",
			missingFileNameInstall: "⚠️ | Please enter the file name to save the command (with .js extension)",
			invalidUrl: "⚠️ | Please enter a valid url",
			invalidUrlOrCode: "⚠️ | Unable to get command code",
			alreadExist: "⚠️ | The command file already exists, are you sure you want to overwrite the old command file?",
			installed: "✅ | Installed command \"%1\" successfully, the command file is saved at %2",
			installedError: "❌ | Failed to install command \"%1\" with error\n%2: %3",
			missingFile: "⚠️ | Command file \"%1\" not found",
			invalidFileName: "⚠️ | Invalid command file name",
			unloadedFile: "✅ | Unloaded command \"%1\""
		},
		bn: {
			missingFileName: "⚠️ | যে কমান্ডটি reload করতে চান তার নাম দিন",
			loaded: "✅ | কমান্ড \"%1\" সফলভাবে load হয়েছে",
			loadedError: "❌ | কমান্ড \"%1\" load করা যায়নি\n%2: %3",
			loadedSuccess: "✅ | সফলভাবে (%1) টি কমান্ড load হয়েছে",
			loadedFail: "❌ | (%1) টি কমান্ড load করা যায়নি\n%2",
			openConsoleToSeeError: "👀 | বিস্তারিত error দেখতে console দেখুন",
			missingCommandNameUnload: "⚠️ | যে কমান্ডটি unload করতে চান তার নাম দিন",
			unloaded: "✅ | কমান্ড \"%1\" সফলভাবে unload হয়েছে",
			unloadedError: "❌ | কমান্ড \"%1\" unload করা যায়নি\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | URL/code এবং command file name দিন",
			missingUrlOrCode: "⚠️ | command file-এর URL অথবা code দিন",
			missingFileNameInstall: "⚠️ | command save করার জন্য file name দিন (.js সহ)",
			invalidUrl: "⚠️ | সঠিক URL দিন",
			invalidUrlOrCode: "❌ | command code পাওয়া যায়নি",
			alreadExist: "⚠️ | এই command file আগে থেকেই আছে। পুরোনো file replace করতে চান?",
			installed: "✅ | command \"%1\" সফলভাবে install হয়েছে\n📁 File: %2",
			installedError: "❌ | command \"%1\" install করা যায়নি\n%2: %3",
			missingFile: "⚠️ | command file \"%1\" পাওয়া যায়নি",
			invalidFileName: "⚠️ | Invalid command file name",
			unloadedFile: "✅ | command \"%1\" unload হয়েছে"
		}
	},
	onStart: async ({ args, message, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, event, commandName, getLang, userID }) => {
		const { unloadScripts, loadScripts } = global.utils;
		const telegramDocument = getTelegramDocument(event);
		if (telegramDocument && String(commandName || "").toLowerCase() === "cmd" && (!args[0] || /^(?:install|add)$/i.test(String(args[0])))) {
			try {
				const { fileName, rawCode } = await downloadTelegramDocument(event, api);
				if (!rawCode.trim()) throw new Error("JavaScript file is empty");
				if (fs.existsSync(commandPath(fileName))) {
					global.cmdInstallPending = global.cmdInstallPending || new Map();
					global.cmdInstallPending.set(`${event.senderID}:${fileName}`, { userID: String(event.senderID), fileName, rawCode, createdAt: Date.now() });
					return message.reply({ body: getLang("alreadExist"), reply_markup: commandButtons(fileName, String(event.senderID)).reply_markup });
				}
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
				return infoLoad.status === "success"
					? message.reply(getLang("installed", infoLoad.name, path.join(__dirname, `${infoLoad.name}.js`).replace(process.cwd(), "")))
					: message.reply(getLang("installedError", fileName, infoLoad.error.name, infoLoad.error.message));
			} catch (err) {
				return message.reply(getLang("installedError", "command.js", err.name || "Error", err.message || String(err)));
			}
		}
		if (args[0] === "load" && args.length === 2) {
			if (!args[1]) return message.reply(getLang("missingFileName"));
			const loadFile = commandBaseName(args[1]);
			if (!loadFile) return message.reply(getLang("invalidFileName"));
			const infoLoad = loadScripts("cmds", loadFile, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
			if (infoLoad.status === "success") {
				return message.reply(getLang("loaded", infoLoad.name));
			} else {
				message.reply(getLang("loadedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message) + "\n" + infoLoad.error.stack);
				console.log(infoLoad.errorWithThoutRemoveHomeDir);
			}
		}
		else if ((args[0] || "").toLowerCase() === "loadall" || (args[0] === "load" && args.length > 2)) {
			const fileNeedToLoad = args[0].toLowerCase() === "loadall"
				? fs.readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.match(/(eg)\.js$/g) && (process.env.NODE_ENV === "development" ? true : !file.match(/(dev)\.js$/g)) && !configCommands.commandUnload?.includes(file)).map(item => item.split(".")[0])
				: args.slice(1).map(commandBaseName).filter(Boolean).map(item => item.slice(0, -3));
			const arraySucces = [];
			const arrayFail = [];
			for (const fileName of fileNeedToLoad) {
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, undefined, true);
				if (infoLoad.status === "success") arraySucces.push(fileName);
				else arrayFail.push(` ❗ ${fileName} => ${infoLoad.error.name}: ${infoLoad.error.message}`);
			}
			try {
				fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
			} catch (error) {
				log.err("LOADALL_CONFIG", error.message);
			}
			return message.reply(`✅ | Loaded ${arraySucces.length} commands`);
		}
		else if ((args[0] || "").toLowerCase() === "unload") {
			if (!args[1]) return message.reply(getLang("missingCommandNameUnload"));
			const unloadFile = commandBaseName(args[1]);
			if (!unloadFile) return message.reply(getLang("invalidFileName"));
			try {
				const infoUnload = unloadScripts("cmds", unloadFile.slice(0, -3), configCommands, getLang);
				return message.reply(getLang("unloaded", infoUnload.name));
			} catch (err) {
				return message.reply(getLang("unloadedError", unloadFile, err.name || "Error", err.message || String(err)));
			}
		}
		else if ((args[0] || "").toLowerCase() === "rename") {
			const oldFile = normalizeCommandFileName(args[1]);
			const newFile = normalizeCommandFileName(args[2]);
			if (!oldFile || !newFile) return message.reply("⚠️ | Usage: cmd rename old.js new.js");
			if (!fs.existsSync(commandPath(oldFile))) return message.reply(getLang("missingFile", oldFile));
			if (fs.existsSync(commandPath(newFile))) return message.reply(`⚠️ | Command file "${newFile}" already exists`);
			try {
				try { unloadScripts("cmds", oldFile.slice(0, -3), configCommands, getLang); } catch (_) {}
				fs.renameSync(commandPath(oldFile), commandPath(newFile));
				const db = global.db || {};
				const infoLoad = loadScripts("cmds", newFile.slice(0, -3), log, configCommands, api, db.threadModel || threadModel, db.userModel || userModel, db.dashBoardModel || dashBoardModel, db.globalModel || globalModel, db.threadsData || threadsData, db.usersData || usersData, db.dashBoardData || dashBoardData, db.globalData || globalData, getLang);
				if (infoLoad.status !== "success") throw infoLoad.error;
				return message.reply(`✅ | Renamed command "${oldFile}" to "${newFile}" successfully`);
			} catch (err) {
				return message.reply(`❌ | Failed to rename command "${oldFile}" with error\n${err.name || "Error"}: ${err.message || err}`);
			}
		}
		else if (["del", "delete"].includes((args[0] || "").toLowerCase())) {
			if (!args[1]) return message.reply("⚠️ | Please enter the command file name you want to delete");
			const fileName = normalizeCommandFileName(args[1]);
			if (!fileName) return message.reply(getLang("invalidFileName"));
			const filePath = commandPath(fileName);
			if (!fs.existsSync(filePath)) return message.reply(getLang("missingFile", fileName));
			try {
				try { unloadScripts("cmds", fileName.slice(0, -3), configCommands, getLang); } catch (_) {}
				fs.unlinkSync(filePath);
				return message.reply(`🗑️ | Deleted command file "${fileName}" successfully`);
			} catch (err) {
				return message.reply(`❌ | Failed to delete command "${fileName}" with error\n${err.name || "Error"}: ${err.message || err}`);
			}
		}
		else if (["install", "add"].includes((args[0] || "").toLowerCase())) {
			let url = args[1];
			let fileName = args[2];
			let rawCode;
			if (!url || !fileName) return message.reply(getLang("missingUrlCodeOrFileName"));
			if (url.endsWith(".js") && !isURL(url)) {
				const tmp = fileName;
				fileName = url;
				url = tmp;
			}
			if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
				global.utils.log.dev("install", "url", url);
				if (!fileName || !fileName.endsWith(".js")) return message.reply(getLang("missingFileNameInstall"));
				const domain = getDomain(url);
				if (!domain) return message.reply(getLang("invalidUrl"));
				if (domain === "pastebin.com") {
					const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
					if (url.match(regex)) url = url.replace(regex, "https://pastebin.com/raw/$1");
					if (url.endsWith("/")) url = url.slice(0, -1);
				} else if (domain === "github.com") {
					const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
					if (url.match(regex)) url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
				}
				rawCode = (await axios.get(url)).data;
				if (domain === "savetext.net") {
					const $ = cheerio.load(rawCode);
					rawCode = $("#content").text();
				}
			} else {
				global.utils.log.dev("install", "code", args.slice(1).join(" "));
				if (args[args.length - 1].endsWith(".js")) {
					fileName = args[args.length - 1];
					rawCode = event.body.slice(event.body.indexOf("install") + 7, event.body.indexOf(fileName) - 1);
				} else if (args[1] && args[1].endsWith(".js")) {
					fileName = args[1];
					rawCode = event.body.slice(event.body.indexOf(fileName) + fileName.length + 1);
				} else {
					return message.reply(getLang("missingFileNameInstall"));
				}
			}
			if (!rawCode) return message.reply(getLang("invalidUrlOrCode"));
			fileName = safeFileName(fileName);
			if (!fileName) return message.reply(getLang("invalidFileName"));
			const alreadyExists = fs.existsSync(commandPath(fileName));
			// Auto-overwrite when file already exists (no more stuck "already exist" state)
			if (alreadyExists) {
				try {
					unloadScripts("cmds", fileName.slice(0, -3), configCommands, getLang);
				} catch (_) {}
			}
			const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
			if (infoLoad.status === "success") {
				const savePath = path.join(__dirname, `${infoLoad.name}.js`).replace(process.cwd(), "");
				const msg = alreadyExists
					? `✅ | Overwritten & installed command "${infoLoad.name}" successfully\n📁 ${savePath}`
					: getLang("installed", infoLoad.name, savePath);
				return message.reply(msg);
			}
			return message.reply(getLang("installedError", fileName, infoLoad.error?.name || "Error", infoLoad.error?.message || String(infoLoad.error)));
		}
		else {
			return message.SyntaxError();
		}
	},
	onCallback: async function ({ event, ctx, message, api, getLang }) {
		if (typeof getLang !== "function") {
			const configuredLang = String(event?.lang || event?.language || global.GoatBot?.config?.language || "en").toLowerCase();
			const langCode = configuredLang.split(/[-_]/)[0];
			const langTable = module.exports.langs || {};
			getLang = (key, ...args) => {
				let text = langTable?.[langCode]?.[key] ?? langTable?.en?.[key];
				if (text === undefined) return `Can't find text: "${key}"`;
				text = String(text);
				for (let i = args.length - 1; i >= 0; i--) text = text.replace(new RegExp(`%${i + 1}`, "g"), String(args[i] ?? ""));
				return text;
			};
		}
		const data = String(event?.data || "");
		const match = data.match(/^cmd_(replace|rename|cancel)_(\d+)_(.+\.js)$/i);
		if (!match) return;
		const [, action, userID, encodedFileName] = match;
		if (String(event.userID) !== String(userID)) {
			await ctx.answerCbQuery("❌ This button is not for you.");
			return;
		}
		const fileName = safeFileName(encodedFileName);
		if (!fileName) { await ctx.answerCbQuery("❌ Invalid file name."); return; }
		const key = `${userID}:${fileName}`;
		const pending = global.cmdInstallPending?.get(key);
		if (!pending || Date.now() - pending.createdAt > 10 * 60 * 1000) {
			global.cmdInstallPending?.delete(key);
			await ctx.answerCbQuery("⚠️ This install request expired.");
			return;
		}
		if (action === "cancel") {
			global.cmdInstallPending.delete(key);
			await ctx.answerCbQuery("Cancelled");
			await ctx.editMessageText("❌ | Install cancelled.");
			return;
		}
		if (action === "replace") {
			try {
				const db = global.db || {};
				const apiRef = global.GoatBot?.api || global.GoatBot || api;
				try { global.utils.unloadScripts("cmds", fileName.slice(0, -3), configCommands, getLang); } catch (_) {}
				const infoLoad = loadScripts(
					"cmds", fileName, log, configCommands, apiRef,
					db.threadModel, db.userModel,
					db.dashboardModel || db.dashBoardModel,
					db.globalModel,
					db.threadsData, db.usersData,
					db.dashBoardData || db.dashboardData,
					db.globalData, getLang, pending.rawCode
				);
				if (infoLoad.status !== "success") throw infoLoad.error;
				global.cmdInstallPending.delete(key);
				await ctx.answerCbQuery("Replaced successfully");
				await ctx.editMessageText(getLang("installed", infoLoad.name, path.join(__dirname, `${infoLoad.name}.js`).replace(process.cwd(), "")));
			} catch (err) {
				await ctx.answerCbQuery("❌ Replace failed");
				await ctx.editMessageText(getLang("installedError", fileName, err.name || "Error", err.message || String(err)));
			}
			return;
		}
		if (action === "rename") {
			global.cmdRenamePending = global.cmdRenamePending || new Map();
			global.cmdRenamePending.set(String(userID), { ...pending, oldFileName: fileName, createdAt: Date.now() });
			await ctx.answerCbQuery("Send the new filename");
			await ctx.editMessageText(`✏️ Send the new filename using your current prefix:\n\n<your-prefix>cmd rename ${fileName} newname.js`);
			return;
		}
	}
};

function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode, deferConfigWrite = false) {
	const GoatBot = global.GoatBot;
	if (!GoatBot) throw new Error("GoatBot is not initialized");
	if (!GoatBot.commands) GoatBot.commands = new Map();
	if (!GoatBot.eventCommands) GoatBot.eventCommands = new Map();
	if (!GoatBot.aliases) GoatBot.aliases = new Map();
	if (!Array.isArray(GoatBot.onChat)) GoatBot.onChat = [];
	if (!Array.isArray(GoatBot.onEvent)) GoatBot.onEvent = [];
	const allOnChat = GoatBot.onChat;
	const allOnEvent = GoatBot.onEvent;
	const allowOnChat = allOnChat;
	const allowOnEvent = allOnEvent;
	const setMap = folder === "cmds" ? "commands" : "eventCommands";
	const typeEnvCommand = folder === "cmds" ? "envCommands" : "envEvents";
	const commandType = folder === "cmds" ? "command" : "event command";
	if (!configCommands[typeEnvCommand]) configCommands[typeEnvCommand] = {};
	const storageCommandFilesPath = global.GoatBot[folder === "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];
	try {
		if (rawCode) {
			fileName = fileName.slice(0, -3);
			fs.writeFileSync(path.normalize(`${process.cwd()}/scripts/${folder}/${fileName}.js`), rawCode);
		}
		const pathCommand = path.normalize(`${process.cwd()}/scripts/${folder}/${fileName}.js`);
		const resolvedPath = require.resolve(pathCommand);
		const cachedCommand = require.cache[resolvedPath]?.exports;
		const oldCommandName = cachedCommand?.config?.name;
		if (cachedCommand?.config?.aliases) {
			let oldAliases = cachedCommand.config.aliases;
			if (typeof oldAliases === "string") oldAliases = [oldAliases];
			for (const alias of oldAliases) GoatBot.aliases.delete(alias);
		}
		delete require.cache[resolvedPath];
		const command = require(pathCommand);
		const loadedCommandName = command?.config?.name;
		if (!loadedCommandName) throw new Error(`Name of command is missing in "${removeHomeDir(pathCommand)}"`);
		command.location = pathCommand;
		const configCommand = command.config;
		if (!configCommand || typeof configCommand !== "object") throw new Error("config of command must be an object");
		const scriptName = configCommand.name;
		const indexOnChat = allOnChat.findIndex(item => item === oldCommandName);
		if (indexOnChat !== -1) allOnChat.splice(indexOnChat, 1);
		const indexOnEvent = allOnEvent.findIndex(item => item === oldCommandName);
		if (indexOnEvent !== -1) allOnEvent.splice(indexOnEvent, 1);
		if (command.onLoad) {
			command.onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });
		}
		const { envGlobal, envConfig } = configCommand;
		const handlerNames = ["onStart", "onLoad", "onReply", "onChat", "onReaction", "onEvent", "handlerEvent"];
		for (const handlerName of handlerNames) {
			if (command[handlerName] !== undefined && typeof command[handlerName] !== "function")
				throw new Error(`Function ${handlerName} must be a function!`);
		}
		if (!scriptName) throw new Error("Name of command is missing!");
		if (configCommand.aliases) {
			let { aliases } = configCommand;
			if (typeof aliases === "string") aliases = [aliases];
			for (const alias of aliases) {
				if (aliases.filter(item => item === alias).length > 1)
					throw new Error(`alias "${alias}" duplicate in ${commandType} "${scriptName}"`);
				if (GoatBot.aliases.has(alias))
					throw new Error(`alias "${alias}" is already exist`);
				GoatBot.aliases.set(alias, scriptName);
			}
		}
		if (envGlobal) {
			if (typeof envGlobal !== "object" || Array.isArray(envGlobal)) throw new Error("envGlobal must be an object");
			for (const key in envGlobal) configCommands.envGlobal[key] = envGlobal[key];
		}
		if (envConfig && typeof envConfig === "object" && !Array.isArray(envConfig)) {
			if (!configCommands[typeEnvCommand]) configCommands[typeEnvCommand] = {};
			if (!configCommands[typeEnvCommand][scriptName]) configCommands[typeEnvCommand][scriptName] = {};
			configCommands[typeEnvCommand][scriptName] = envConfig;
		}
		GoatBot[setMap].delete(oldCommandName);
		GoatBot[setMap].set(scriptName, command);
		const keyUnloadCommand = folder === "cmds" ? "commandUnload" : "commandEventUnload";
		const findIndex = (configCommands[keyUnloadCommand] || []).indexOf(`${fileName}.js`);
		if (findIndex !== -1) configCommands[keyUnloadCommand].splice(findIndex, 1);
		if (!deferConfigWrite) fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
		if (command.onChat) allOnChat.push(scriptName);
		if (command.onEvent) allOnEvent.push(scriptName);
		const indexStorageCommandFilesPath = storageCommandFilesPath.findIndex(item => item.filePath === pathCommand);
		if (indexStorageCommandFilesPath !== -1) storageCommandFilesPath.splice(indexStorageCommandFilesPath, 1);
		storageCommandFilesPath.push({ filePath: pathCommand, commandName: [scriptName, ...(configCommand.aliases || [])] });
		return { status: "success", name: fileName, command };
	} catch (err) {
		const defaultError = new Error();
		defaultError.name = err.name;
		defaultError.message = err.message;
		defaultError.stack = err.stack;
		if (err.stack) err.stack = removeHomeDir(err.stack || "");
		if (!deferConfigWrite) fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
		return { status: "failed", name: fileName, error: err, errorWithThoutRemoveHomeDir: defaultError };
	}
}

function unloadScripts(folder, fileName, configCommands, getLang) {
	const pathCommand = `${process.cwd()}/scripts/${folder}/${fileName}.js`;
	if (!fs.existsSync(pathCommand)) {
		const err = new Error(getLang("missingFile", `${fileName}.js`));
		err.name = "FileNotFound";
		throw err;
	}
	const command = require(pathCommand);
	const commandName = command.config?.name;
	if (!commandName) throw new Error(getLang("invalidFileName", `${fileName}.js`));
	const { GoatBot } = global;
	const { onChat: allOnChat, onEvent: allOnEvent } = GoatBot;
	const indexOnChat = allOnChat.findIndex(item => item === commandName);
	if (indexOnChat !== -1) allOnChat.splice(indexOnChat, 1);
	const indexOnEvent = allOnEvent.findIndex(item => item === commandName);
	if (indexOnEvent !== -1) allOnEvent.splice(indexOnEvent, 1);
	if (command.config.aliases) {
		let aliases = command.config.aliases;
		if (typeof aliases === "string") aliases = [aliases];
		for (const alias of aliases) GoatBot.aliases.delete(alias);
	}
	const setMap = folder === "cmds" ? "commands" : "eventCommands";
	delete require.cache[require.resolve(pathCommand)];
	GoatBot[setMap].delete(commandName);
	log.master("UNLOADED", getLang("unloaded", commandName));
	const commandUnload = configCommands[folder === "cmds" ? "commandUnload" : "commandEventUnload"] || [];
	if (!commandUnload.includes(`${fileName}.js`)) commandUnload.push(`${fileName}.js`);
	configCommands[folder === "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;
	fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
	return { status: "success", name: fileName };
}
global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;
