process.on("unhandledRejection", (error) => console.log(error));
process.on("uncaughtException", (error) => console.log(error));
const fs = require("fs-extra");
const { execSync } = require("child_process");
const log = require("./logger/log.js");
const path = require("path");
const http = require("http");
const axios = require("axios");
process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;
const port = Number(process.env.PORT) || 3000;
const server = http.createServer((req, res) => {
	const url = req.url || "/";
	if (url === "/health" || url === "/uptime") {
		res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
		res.end(JSON.stringify({
			status: "ok",
			uptime: process.uptime(),
			message: "Bot is running"
		}));
	} else {
		res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
		res.end("Bot'Bee is running");
	}
});
server.on("error", (error) => {
	console.error("HTTP server error:", error.message);
});
server.listen(port, "0.0.0.0", () => {
	console.log(`HTTP server is listening on port ${port}`);
});
try {
	require("./bot/autoUptime.js");
} catch (e) {
	console.error("Keep-Alive load error:", e.message);
}

function validJSON(pathDir) {
	try {
		if (!fs.existsSync(pathDir)) throw new Error(`File "${pathDir}" not found`);
		JSON.parse(fs.readFileSync(pathDir, "utf8"));
		return true;
	} catch (err) {
		throw new Error(err.message);
	}
}
const { NODE_ENV } = process.env;
const dirConfig = path.normalize(`${__dirname}/config.json`);
const dirConfigCommands = path.normalize(`${__dirname}/configCommands.json`);
const dirAccount = path.normalize(`${__dirname}/account.txt`);
for (const pathDir of [dirConfig, dirConfigCommands]) {
	try {
		validJSON(pathDir);
	} catch (err) {
		log.error("CONFIG", `Invalid JSON file "${pathDir.replace(__dirname, "")}":\n${err.message.split("\n").map((line) => `  ${line}`).join("\n")}\nPlease fix it and restart bot`);
		process.exit(0);
	}
}
const config = require(dirConfig);
for (const key of ["adminBot"]) {
	if (Array.isArray(config[key])) config[key] = config[key].map((id) => id.toString()).filter(Boolean);
}
if (config.whiteListMode?.whiteListIds && Array.isArray(config.whiteListMode.whiteListIds)) {
	config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.map((id) => id.toString()).filter(Boolean);
}
if (config.whiteListModeThread?.whiteListThreadIds && Array.isArray(config.whiteListModeThread.whiteListThreadIds)) {
	config.whiteListModeThread.whiteListThreadIds = config.whiteListModeThread.whiteListThreadIds.map((id) => id.toString()).filter(Boolean);
}
const configCommands = require(dirConfigCommands);
global.GoatBot = {
	startTime: Date.now() - process.uptime() * 1000,
	commands: new Map(),
	eventCommands: new Map(),
	commandFilesPath: [],
	eventCommandsFilesPath: [],
	aliases: new Map(),
	onChat: [],
	onEvent: [],
	onReply: new Map(),
	onReaction: new Map(),
	config,
	configCommands,
	envCommands: {},
	envEvents: {},
	envGlobal: {},
	reLoginBot: function () {},
	Listening: null,
	oldListening: [],
	callbackListenTime: {},
	storage5Message: [],
	botID: null,
};
global.db = {
	allThreadData: [],
	allUserData: [],
	allDashBoardData: [],
	allGlobalData: [],
	threadModel: null,
	userModel: null,
	dashboardModel: null,
	globalModel: null,
	threadsData: null,
	usersData: null,
	dashBoardData: null,
	globalData: null,
	receivedTheFirstMessage: {},
};
global.client = {
	dirConfig,
	dirConfigCommands,
	dirAccount,
	countDown: {},
	cache: {},
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingGlobalData: [],
	},
	commandBanned: configCommands.commandBanned,
};
const utils = require("./utils.js");
global.utils = utils;
const { colors } = utils;
global.temp = {
	createThreadData: [],
	createUserData: [],
	createThreadDataError: [],
	contentScripts: { cmds: {}, events: {} },
};
const watchAndReloadConfig = (dir, type, prop, logName) => {
	let lastModified = fs.statSync(dir).mtimeMs;
	let isFirstModified = true;
	fs.watch(dir, (eventType) => {
		if (eventType === type) {
			const oldConfig = global.GoatBot[prop];
			setTimeout(() => {
				try {
					if (isFirstModified) {
						isFirstModified = false;
						return;
					}
					if (lastModified === fs.statSync(dir).mtimeMs) return;
					global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, "utf-8"));
					log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
				} catch (err) {
					log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
					global.GoatBot[prop] = oldConfig;
				} finally {
					lastModified = fs.statSync(dir).mtimeMs;
				}
			}, 200);
		}
	});
};
watchAndReloadConfig(dirConfigCommands, "change", "configCommands", "CONFIG COMMANDS");
watchAndReloadConfig(dirConfig, "change", "config", "CONFIG");
global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;
const getText = global.utils.getText;
if (config.autoRestart) {
	const time = config.autoRestart.time;
	if (!isNaN(time) && time > 0) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart1", utils.convertTime(time, true)));
		setTimeout(() => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		}, time);
	} else if (typeof time == "string" && time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)) {
		utils.log.info("AUTO RESTART", getText("Goat", "autoRestart2", time));
		const cron = require("node-cron");
		cron.schedule(time, () => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		});
	}
}
require(`./bot/login/login${NODE_ENV === "development" ? ".dev.js" : ".js"}`);
void (async () => {
	try {
		const { data: { version } } = await axios.get(
			"https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/package.json",
			{ timeout: 5000 }
		);
		const currentVersion = require("./package.json").version;
		if (compareVersion(version, currentVersion) === 1) {
			utils.log.master("NEW VERSION", getText(
				"Goat",
				"newVersionDetected",
				colors.gray(currentVersion),
				colors.hex("#eb6a07", version),
				colors.hex("#eb6a07", "node update")
			));
		}
	} catch (_) {
	}
})();

function compareVersion(version1, version2) {
	const v1 = version1.split(".");
	const v2 = version2.split(".");
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i])) return 1;
		if (parseInt(v1[i]) < parseInt(v2[i])) return -1;
	}
	return 0;
}
