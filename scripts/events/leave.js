const fs = require("fs");
const path = require("path");
const axios = require("axios");
let createCanvas, loadImage;
let CANVAS_OK = false;
try {
	({ createCanvas, loadImage } = require("canvas"));
	CANVAS_OK = true;
} catch (e) {
	console.log("[EVENTS] canvas not installed — banners disabled. Run: npm i canvas");
}
const BG_IMAGES = [
	"https://drive.google.com/uc?export=download&id=1-sp2NfVYAMFnUkkWQ6ylWfaJfjEMwau2",
	"https://drive.google.com/uc?export=download&id=1q6odBpXiMkjT8sQRkUJwWx4oNixdmmNI"
];
const CACHE_DIR = path.join(process.cwd(), "cache");

function safeName(str, len = 18) {
	try {
		if (!str) return "Unknown";
		str = String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
		if (!str) return "Unknown";
		const arr = Array.from(str);
		if (arr.length > len) return arr.slice(0, len).join("") + "…";
		return arr.join("");
	} catch {
		return "Unknown";
	}
}

function botToken(api) {
	return api?.token
		|| global.GoatBot?.config?.botInfo?.token
		|| global.config?.botInfo?.token
		|| global.config?.token
		|| "";
}

async function getAvatarUrl(api, userId) {
	try {
		const p = await api.getUserProfilePhotos(userId);
		if (p && p.total_count > 0) {
			const f = p.photos[0].at(-1).file_id;
			const file = await api.getFile(f);
			return `https://api.telegram.org/file/bot${botToken(api)}/${file.file_path}`;
		}
	} catch {}
	return null;
}

async function createBanner(d) {
	if (!CANVAS_OK) throw new Error("canvas_not_installed");
	const W = 1416, H = 856;
	const c = createCanvas(W, H);
	const ctx = c.getContext("2d");
	try {
		await fs.promises.mkdir(CACHE_DIR, { recursive: true });
		const i = Math.floor(Math.random() * BG_IMAGES.length);
		const bgP = path.join(CACHE_DIR, `goodbye_bg_${i}.jpg`);
		if (!fs.existsSync(bgP)) {
			const r = await axios({ url: BG_IMAGES[i], method: "GET", responseType: "arraybuffer", timeout: 20000 });
			fs.writeFileSync(bgP, Buffer.from(r.data));
		}
		const bg = await loadImage(bgP);
		ctx.drawImage(bg, 0, 0, W, H);
	} catch {
		ctx.fillStyle = "#1a0000";
		ctx.fillRect(0, 0, W, H);
	}
	ctx.fillStyle = "rgba(50,0,0,0.6)";
	ctx.fillRect(0, 0, W, H);
	async function loadCircle(url, x, y, s, glow) {
		if (!url) return;
		try {
			const r = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
			const img = await loadImage(r.data);
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, s, 0, Math.PI * 2);
			ctx.clip();
			ctx.drawImage(img, x - s - 15, y - s - 15, (s + 15) * 2, (s + 15) * 2);
			ctx.restore();
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, s + 4, 0, Math.PI * 2);
			ctx.strokeStyle = glow;
			ctx.lineWidth = 9;
			ctx.shadowColor = glow;
			ctx.shadowBlur = 35;
			ctx.stroke();
			ctx.restore();
		} catch {}
	}
	await loadCircle(d.avatarUrl, 260, 320, 145, "#FF0000");
	await loadCircle(d.groupImage, 708, 340, 130, "#A020F0");
	await loadCircle(d.kickerAvatar, 1150, 320, 145, "#FFAA00");
	function drawLabel(x, y, t, n) {
		ctx.save();
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(x - 110, y, 220, 75);
		ctx.strokeStyle = "#ff5555";
		ctx.lineWidth = 2;
		ctx.strokeRect(x - 110, y, 220, 75);
		ctx.restore();
		ctx.textAlign = "center";
		ctx.shadowColor = "#ff0000";
		ctx.shadowBlur = 15;
		ctx.fillStyle = "#ff8888";
		ctx.font = "bold 20px Arial";
		ctx.fillText(t, x, y + 22);
		ctx.shadowBlur = 0;
		ctx.fillStyle = "#fff";
		ctx.font = "bold 22px Arial";
		const displayName = n || "Unknown";
		ctx.fillText((displayName.length > 14 ? displayName.substring(0, 14) + ".." : displayName).toUpperCase(), x, y + 50);
	}
	drawLabel(260, 520, "LEFT USER", d.name);
	drawLabel(708, 520, "GROUP", d.groupName);
	drawLabel(1150, 520, d.kickType, d.kickerName);
	ctx.textAlign = "center";
	ctx.shadowColor = "#ff0000";
	ctx.shadowBlur = 25;
	ctx.fillStyle = "#fff";
	ctx.font = "bold 64px Arial";
	ctx.fillText("GOODBYE", W / 2, 110);
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#ff8888";
	ctx.font = "bold 28px Arial";
	ctx.fillText("WE WILL MISS YOU", W / 2, 170);
	ctx.beginPath();
	ctx.moveTo(0, 10);
	ctx.lineTo(W, 10);
	ctx.strokeStyle = "#FF0000";
	ctx.lineWidth = 5;
	ctx.shadowColor = "#FF0000";
	ctx.shadowBlur = 25;
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, H - 10);
	ctx.lineTo(W, H - 10);
	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#fff";
	ctx.font = "bold 22px Arial";
	ctx.fillText(`SK-SIDDIK • ${d.member} Members Left`, W / 2, H - 25);
	fs.writeFileSync(d.output, c.toBuffer("image/png"));
}

module.exports = {
	config: {
        name: "leave",
        version: "4.1-TELEGRAM",
        author: "SK-SIDDIK-KHAN",
        usePrefix: true,
        category: "events",
    },
	onStart: async function ({ event, api, message, threadsData, usersData }) {
		if (event.logMessageType !== "log:unsubscribe") return;
		return async function () {
			try {
				const threadID = String(event.threadID);
				const leftId = String(event.logMessageData?.leftParticipantFbId || event.left_chat_member?.id || "");
				if (!leftId) return;
				let botId = "";
				try {
					botId = String(api.getCurrentUserID?.() || (await api.getMe?.())?.id || global.GoatBot?.botID || "");
				} catch {}
				if (botId && leftId === botId) return;
				const leftMember = event.left_chat_member
					|| event.raw?.left_chat_member
					|| event.raw?.new_chat_member?.user
					|| null;
				if (leftMember?.is_bot) return;
				await fs.promises.mkdir(CACHE_DIR, { recursive: true });
				const chatTitle = event.chat?.title
					|| event.raw?.chat?.title
					|| (await threadsData.get(threadID).catch(() => ({})))?.threadName
					|| "group";
				let rawName = leftMember
					? [leftMember.first_name, leftMember.last_name].filter(Boolean).join(" ")
					: null;
				if (!rawName) {
					try { rawName = await usersData.getName(leftId); } catch {}
				}
				rawName = rawName || `User ${leftId}`;
				const userName = safeName(rawName, 16);
				const botName = global.GoatBot?.config?.botInfo?.name || global.GoatBot?.config?.nickNameBot || "SK-SIDDIK";
				const safeGroup = safeName(chatTitle, 18);
				let kickerName = "Unknown";
				let kickType = "LEFT";
				const actorId = String(event.author || event.from?.id || event.senderID || "");
				if (actorId) {
					try {
						kickerName = safeName(
							event.from?.first_name
							|| (await usersData.getName(actorId).catch(() => null))
							|| "Unknown",
							12
						);
					} catch {}
					kickType = actorId === leftId ? "SELF LEAVE" : "KICKED BY";
				}
				let groupImageUrl = null;
				try {
					const cp = await api.getChat(threadID);
					if (cp?.photo?.big_file_id) {
						const f = await api.getFile(cp.photo.big_file_id);
						groupImageUrl = `https://api.telegram.org/file/bot${botToken(api)}/${f.file_path}`;
					}
				} catch {}
				const avatarUrl = await getAvatarUrl(api, leftId);
				const kickerAvatarUrl = actorId ? await getAvatarUrl(api, actorId) : null;
				const bannerPath = path.join(CACHE_DIR, `goodbye_${leftId}.png`);
				let memberCount = 0;
				try { memberCount = await api.getChatMemberCount(threadID); } catch {}
				await createBanner({
					name: rawName,
					kickerName,
					groupName: chatTitle,
					member: memberCount,
					avatarUrl,
					kickerAvatar: kickerAvatarUrl,
					groupImage: groupImageUrl || avatarUrl,
					output: bannerPath,
					kickType
				});
				const bdTime = new Date().toLocaleString("en-BD", {
					timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true
				});
				const reason = kickType === "KICKED BY" ? `👢 Kicked: ${kickerName}` : `🚶 ${kickType}`;
				const msg =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 👋 GOODBYE FAMILY!
├──────────────┤
│ 👤 Name: ${userName}
│ 🆔 ID: ${leftId}
│ 🏠 Group: ${safeGroup}
│ ${reason}
│ ⏰ ${bdTime}
│ 🔢 Left: ${memberCount} Members
├──────────────┤
│ 😢 Miss you 🌙
│ 👑 DEV: SK SIDDIK
╰─❖─〔 SIDDIK-TG-BOT 〕─❖─╯`;
				try {
					await api.sendPhoto(threadID, { source: fs.createReadStream(bannerPath) }, { caption: msg });
				} catch (e) {
					await message.send?.(msg).catch(() => {});
					console.log("[leave] sendPhoto error:", e.message);
				}
				try { fs.unlinkSync(bannerPath); } catch {}
			} catch (e) {
				console.log("[LEAVE ERROR]", e?.stack || e);
			}
		};
	}
};
