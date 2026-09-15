const mediaTypes = ["photo", "png", "animated_image", "video", "audio", "voice", "file", "document", "sticker"];

function getMediaAttachments(list = []) {
	const out = [];
	const seen = new Set();
	for (const item of (Array.isArray(list) ? list : [])) {
		if (!item) continue;
		let type = String(item.type || "file").toLowerCase();
		if (type === "png") type = "photo";
		if (type === "voice") type = "audio";
		if (type === "document") type = "file";
		if (type === "gif") type = "animated_image";
		if (!mediaTypes.includes(type) && type !== "animated_image") continue;
		const fileID = item.fileID || item.file_id || null;
		const url = item.url || null;
		if (!fileID && !url) continue;
		const key = String(fileID || url);
		if (seen.has(key)) continue;
		seen.add(key);
		const obj = { type, filename: item.filename || item.name || undefined };
		if (fileID) obj.fileID = fileID;
		else obj.url = url;
		out.push(obj);
	}
	return out;
}

function getPackageDependencies() {
  try {
    const pkg = require(require("path").join(process.cwd(), "package.json"));
    return { ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}), ...(pkg.devDependencies || {}) };
  } catch (_) { return {}; }
}
function hasPkg(deps, names) { return names.some(n => Object.prototype.hasOwnProperty.call(deps, n)); }
async function readJsonRecords() {
  const fs=require("fs"), path=require("path"), roots=[process.cwd(),path.join(process.cwd(),"database"),path.join(process.cwd(),"data")], files=[], out=[];
  const walk=(dir,d=0)=>{ if(d>2||!fs.existsSync(dir))return; let es=[]; try{es=fs.readdirSync(dir,{withFileTypes:true})}catch(_){return}; for(const e of es){if(e.name==="node_modules"||e.name.startsWith("."))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f,d+1);else if(e.isFile()&&e.name.endsWith(".json")&&!/package(-lock)?\.json$/i.test(e.name))files.push(f)}};
  roots.forEach(r=>walk(r));
  for(const f of files){try{const data=JSON.parse(fs.readFileSync(f,"utf8"));const visit=v=>{if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==="object"){const id=v.threadID??v.threadId??v.chatId??v.chat_id??v.userID??v.userId??v.id;if(id!==undefined)out.push(v);Object.entries(v).forEach(([k,x])=>{if(x&&typeof x==="object"&&!/config|package|dependenc/i.test(k))visit(x)})}};visit(data)}catch(_){} }
  return out;
}
async function readSqliteRecords() {
  const deps=getPackageDependencies(); if(!hasPkg(deps,["better-sqlite3","sqlite3"]))return [];
  const fs=require("fs"),path=require("path"),files=[],out=[],roots=[process.cwd(),path.join(process.cwd(),"database"),path.join(process.cwd(),"data")];
  const walk=(dir,d=0)=>{if(d>2||!fs.existsSync(dir))return;let es=[];try{es=fs.readdirSync(dir,{withFileTypes:true})}catch(_){return};for(const e of es){if(e.name==="node_modules")continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f,d+1);else if(/\.(sqlite|sqlite3|db)$/i.test(e.name))files.push(f)}}; roots.forEach(r=>walk(r));
  for(const f of files){try{if(hasPkg(deps,["better-sqlite3"])){const DB=require("better-sqlite3"),db=new DB(f,{readonly:true});for(const t of db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()){const n=String(t.name).replace(/"/g,'""'),cols=db.prepare(`PRAGMA table_info("${n}")`).all();if(!cols.some(c=>/thread.?id|chat.?id|user.?id|sender.?id|^id$/i.test(c.name)))continue;out.push(...db.prepare(`SELECT * FROM "${n}" LIMIT 5000`).all())}db.close()}}catch(_){} }
  return out;
}

function isGroupThread(t) {
	if (!t) return false;
	if (t.isGroup === true) return true;
	const id = String(t.threadID || t.id || "");
	return id.startsWith("-");
}

function isUserThread(t) {
	if (!t) return false;
	if (t.isGroup === true) return false;
	const id = String(t.threadID || t.id || "");
	if (!id || id === "undefined" || id === "null") return false;
	if (id.startsWith("-")) return false;
	return /^\d+$/.test(id);
}

function addThread(setGroup, setInbox, t) {
	if (!t) return;
	const tid = String(t.threadID || t.id || t.userID || t.senderID || "");
	if (!tid || tid === "undefined" || tid === "null") return;
	if (isGroupThread(t) || tid.startsWith("-")) setGroup.add(tid);
	else if (isUserThread(t) || /^\d+$/.test(tid)) setInbox.add(tid);
}

module.exports = {
	config: {
    name: "notification",
		aliases: ["notify", "noti"],
		version: "1.5.0",
		author: "SK-SIDDIK-KHAN",
		countDown: 5,
		role: 2,
		usePrefix: true,
		
		
		
		envConfig: { delayPerGroup: 250 },
    description: {
            vi: "Gửi thông báo từ admin đến all box và inbox",
            en: "Send notification from admin to all groups and user inboxes"
        },
        category: "owner",
        guide: {
            en: "{pn} <tin nhắn>"
        }
},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm",
			notification: "Thông báo từ admin bot",
			sendingNotification: "Bắt đầu gửi thông báo đến %1 nhóm + %2 inbox...",
			sentNotification: "✅ Đã gửi thông báo thành công: %1 nhóm, %2 inbox",
			errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 chat:\n%2",
			noTarget: "Bot hiện chưa có group hoặc inbox nào được ghi nhận"
		},
		en: {
			missingMessage: "Please enter the message you want to send to all groups",
			notification: "Notification from admin bot",
			sendingNotification: "Start sending notification to %1 groups + %2 inboxes...",
			sentNotification: "✅ Sent notification successfully: %1 groups, %2 inboxes",
			errorSendingNotification: "An error occurred while sending to %1 chats:\n%2",
			noTarget: "No groups or inboxes have been recorded for the bot yet"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, usersData, getLang, threadModel, userModel }) {
		const delayPerGroup = (envCommands?.[commandName]?.delayPerGroup) || 250;
		const media = getMediaAttachments([
			...(event.attachments || []),
			...(event.messageReply?.attachments || [])
		]);

		if ((!args || !args[0]) && media.length === 0)
			return message.reply(getLang("missingMessage"));

		const formSend = {
			body: `${getLang("notification")}\n────────────────\n${(args && args.length) ? args.join(" ") : ""}`.trim(),
			attachment: media
		};

		const groupSet = new Set();
		const inboxSet = new Set();

		try {
			const all = await threadsData?.getAll?.();
			for (const t of (all || [])) addThread(groupSet, inboxSet, t);
		} catch (e) { console.error("[NOTI] threadsData.getAll:", e?.message || e); }

		for (const t of (global.db?.allThreadData || [])) addThread(groupSet, inboxSet, t);
		for (const u of (global.db?.allUserData || [])) addThread(groupSet, inboxSet, u);

		try {
			if (threadModel?.find) {
				const docs = await threadModel.find({}).lean();
				for (const t of (docs || [])) addThread(groupSet, inboxSet, t);
			}
		} catch (_) {}
		try {
			if (userModel?.find) {
				const docs = await userModel.find({}).lean();
				for (const u of (docs || [])) addThread(groupSet, inboxSet, u);
			}
		} catch (_) {}

		try {
			const allUsers = await usersData?.getAll?.() || [];
			for (const u of allUsers) addThread(groupSet, inboxSet, u);
		} catch (_) {}

		try {
			if (api?.chatCache && typeof api.chatCache.keys === "function") {
				for (const tid of api.chatCache.keys()) {
					const id = String(tid);
					if (id.startsWith("-")) groupSet.add(id);
					else if (/^\d+$/.test(id)) inboxSet.add(id);
				}
			}
		} catch (_) {}

		try {
			if (typeof api.getThreadList === "function") {
				const list = await api.getThreadList();
				for (const t of (list || [])) addThread(groupSet, inboxSet, t);
			}
		} catch (_) {}

        try {
          const deps = getPackageDependencies();
          if (hasPkg(deps, ["better-sqlite3", "sqlite3"])) for (const t of await readSqliteRecords()) addThread(groupSet, inboxSet, t);
          for (const t of await readJsonRecords()) addThread(groupSet, inboxSet, t);
        } catch (_) {}

		const groupIDs = [...groupSet];
		const inboxIDs = [...inboxSet];
		const allTargets = [
			...groupIDs.map(id => ({ id, kind: "group" })),
			...inboxIDs.map(id => ({ id, kind: "inbox" }))
		];

		if (allTargets.length === 0) return message.reply(getLang("noTarget"));

		await message.reply(getLang("sendingNotification", groupIDs.length, inboxIDs.length));

		let okGroup = 0;
		let okInbox = 0;
		const sendError = [];
		const waiting = [];

		for (const target of allTargets) {
			try {
				waiting.push({ threadID: target.id, kind: target.kind, pending: api.sendMessage(formSend, target.id) });
				await new Promise(resolve => setTimeout(resolve, delayPerGroup));
			} catch (e) {
				sendError.push({ threadIDs: [String(target.id)], errorDescription: e?.message || String(e) });
			}
		}

		for (const sended of waiting) {
			try {
				await sended.pending;
				if (sended.kind === "group") okGroup++;
				else okInbox++;
			} catch (e) {
				const errorDescription = e?.errorDescription || e?.message || String(e);
				const exist = sendError.find(item => item.errorDescription === errorDescription);
				if (!exist) sendError.push({ threadIDs: [String(sended.threadID)], errorDescription });
				else exist.threadIDs.push(String(sended.threadID));
			}
		}

		let msg = getLang("sentNotification", okGroup, okInbox) + "\n";
		if (sendError.length > 0) {
			msg += getLang(
				"errorSendingNotification",
				sendError.reduce((a, b) => a + b.threadIDs.length, 0),
				sendError.reduce((a, b) => a + `\n - ${b.errorDescription}\n  + ${b.threadIDs.join("\n  + ")}`, "")
			);
		}
		return message.reply(msg.trim());
	}
};
