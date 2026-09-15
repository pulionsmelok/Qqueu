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

function botToken(api) {
	return api?.token
		|| global.GoatBot?.config?.botInfo?.token
		|| global.config?.botInfo?.token
		|| global.config?.token
		|| "";
}

async function getAvatarUrl(api, userId) {
	try {
		const photos = await api.getUserProfilePhotos(userId);
		if (photos?.total_count > 0) {
			const fileId = photos.photos[0].at(-1).file_id;
			const file = await api.getFile(fileId);
			return `https://api.telegram.org/file/bot${botToken(api)}/${file.file_path}`;
		}
	} catch {}
	return null;
}

async function createBanner(data) {
	if (!CANVAS_OK) throw new Error("canvas_not_installed");
	const width = 1416, height = 856;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	const randomIndex = Math.floor(Math.random() * BG_IMAGES.length);
	try {
		await fs.promises.mkdir(CACHE_DIR, { recursive: true });
		const bgPath = path.join(CACHE_DIR, `welcome_bg_${randomIndex}.jpg`);
		if (!fs.existsSync(bgPath)) {
			const res = await axios({ url: BG_IMAGES[randomIndex], method: "GET", responseType: "arraybuffer", timeout: 20000 });
			fs.writeFileSync(bgPath, Buffer.from(res.data));
		}
		const bg = await loadImage(bgPath);
		ctx.drawImage(bg, 0, 0, width, height);
	} catch {
		ctx.fillStyle = "#111827";
		ctx.fillRect(0, 0, width, height);
	}
	const userX = 260, userY = 320, userSize = 145;
	const groupX = 708, groupY = 340, groupSize = 130;
	const adderX = 1150, adderY = 320, adderSize = 145;
	const labelY = 520, labelW = 220, labelH = 75;
	async function loadCircleImage(url, x, y, size, glow) {
		if (!url) return;
		try {
			const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
			const img = await loadImage(res.data);
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.clip();
			ctx.drawImage(img, x - size - 15, y - size - 15, (size + 15) * 2, (size + 15) * 2);
			ctx.restore();
			ctx.save();
			ctx.beginPath();
			ctx.arc(x, y, size + 4, 0, Math.PI * 2);
			ctx.strokeStyle = glow;
			ctx.lineWidth = 9;
			ctx.shadowColor = glow;
			ctx.shadowBlur = 35;
			ctx.stroke();
			ctx.restore();
		} catch {}
	}
	await loadCircleImage(data.avatarUrl, userX, userY, userSize, "#00F5FF");
	await loadCircleImage(data.groupImage, groupX, groupY, groupSize, "#A020F0");
	await loadCircleImage(data.adderAvatar, adderX, adderY, adderSize, "#00FF88");
	function drawLabel(x, y, title, name) {
		ctx.save();
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(x - labelW / 2, y, labelW, labelH);
		ctx.strokeStyle = "#00eaff";
		ctx.lineWidth = 2;
		ctx.strokeRect(x - labelW / 2, y, labelW, labelH);
		ctx.restore();
		ctx.textAlign = "center";
		ctx.shadowColor = "#00ffff";
		ctx.shadowBlur = 15;
		ctx.fillStyle = "#00eaff";
		ctx.font = "bold 20px Arial";
		ctx.fillText(title, x, y + 22);
		ctx.shadowBlur = 0;
		ctx.fillStyle = "#fff";
		ctx.font = "bold 22px Arial";
		const n = String(name || "Unknown");
		ctx.fillText((n.length > 14 ? n.substring(0, 14) + ".." : n).toUpperCase(), x, y + 50);
	}
	drawLabel(userX, labelY, "NEW USER", data.name);
	drawLabel(groupX, labelY, "GROUP", data.groupName);
	drawLabel(adderX, labelY, "ADDED BY", data.adderName);
	ctx.textAlign = "center";
	ctx.shadowColor = "#00ffff";
	ctx.shadowBlur = 20;
	ctx.fillStyle = "#fff";
	ctx.font = "bold 64px Arial";
	ctx.fillText("WELCOME", width / 2, 110);
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#00eaff";
	ctx.font = "bold 28px Arial";
	ctx.fillText("THANKS FOR JOINING", width / 2, 170);
	ctx.beginPath();
	ctx.moveTo(0, 10);
	ctx.lineTo(width, 10);
	ctx.strokeStyle = "#00E5FF";
	ctx.lineWidth = 5;
	ctx.shadowColor = "#00E5FF";
	ctx.shadowBlur = 25;
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, height - 10);
	ctx.lineTo(width, height - 10);
	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.fillStyle = "#FFFFFF";
	ctx.font = "bold 22px Arial";
	ctx.fillText(`SK-SIDDIK • Total: ${data.member} Members`, width / 2, height - 25);
	fs.writeFileSync(data.output, canvas.toBuffer("image/png"));
}

module.exports = {
	config: {
        name: "welcome",
        version: "3.2-TELEGRAM",
        author: "SK-SIDDIK-KHAN",
        usePrefix: true,
        category: "events",
    },
	onStart: async function ({ event, api, message, threadsData, usersData }) {
		if (!event?.logMessageType) return;

		return async function () {
			try {
				const threadID = String(event.threadID || event.chat?.id || "");
				if (!threadID) return;

				const added = event.logMessageData?.addedParticipants || event.raw?.new_chat_members || [];
				const isJoin = event.logMessageType === "log:subscribe" || event.raw?.new_chat_members?.length > 0;
				if (!isJoin) return;

				const chatTitle = event.chat?.title
					|| event.raw?.chat?.title
					|| (await threadsData.get(threadID).catch(() => ({})))?.threadName
					|| "Group";

				await fs.promises.mkdir(CACHE_DIR, { recursive: true });
				let botId = "";
				try {
					botId = String(api.getCurrentUserID?.() || (await api.getMe?.())?.id || global.GoatBot?.botID || "");
				} catch {}

				if (!added?.length) return;
				const participant = added[0];
				const participantId = String(participant?.userFbId ?? participant?.id ?? participant?.user?.id ?? "");

				if (isJoin && botId && participantId === botId) {
					const prefix = global.utils.getPrefix?.(threadID) || global.GoatBot?.config?.prefix || "/";
					const botName = global.GoatBot?.config?.botInfo?.name || global.GoatBot?.config?.nickNameBot || "SK-SIDDIK";
					const adderName = event.from?.first_name
						|| (await usersData.getName?.(event.author).catch(() => null))
						|| "Someone";
					const msg =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 🤖 Hello ${String(chatTitle).slice(0, 28)}!
├──────────────┤
│ ✅ Thanks for adding me!
│ 👤 Added by: ${adderName}
│ ⚙️ Prefix: ${prefix}
│ 💡 ${prefix}help for all cmds
├──────────────┤
│ 👑 DEV: SK SIDDIK
╰─❖─〔 SIDDIK-TG-BOT 〕─❖─╯`;
					try {
						await api.sendMessage(msg, threadID, {
							reply_markup: { inline_keyboard: [[{ text: "👑 Contact Owner", url: "https://t.me/busy1here" }]] }
						});
					} catch {
						await message.send?.(msg).catch(() => {});
					}
					return;
				}

				const userId = participantId || String(event.author || "");
				const userName = participant?.first_name
					|| participant?.name
					|| (await usersData.getName?.(userId).catch(() => null))
					|| "Member";
				const username = participant?.username ? `@${participant.username}` : "N/A";
				const adderName = event.from?.first_name
					|| (await usersData.getName?.(event.author).catch(() => null))
					|| "Someone";


				const bdTime = new Date().toLocaleTimeString("en-BD", {
					timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true
				});
				const bdDate = new Date().toLocaleDateString("en-BD", {
					timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric"
				});
				const output = path.join(CACHE_DIR, `welcome_${threadID}_${userId || Date.now()}.png`);
				const groupImage = null;
				const avatarUrl = userId ? await getAvatarUrl(api, userId) : null;
				const adderAvatar = event.author ? await getAvatarUrl(api, String(event.author)) : null;
				const memberCount = event.chat?.member_count || event.raw?.chat?.member_count || "?";

				const welcomeMessage =
`╭──❖〔 WELCOME FAMILY 〕❖──╮
│ 👤 Name : ${userName}
│ 🆔 UID : ${userId || "N/A"}
│ 📝 User : ${username}
│ 🏠 Group : ${chatTitle}
│ ➕ Added : ${adderName}
│ ⏰ Time : ${bdTime}
│ 📅 Date : ${bdDate}
╰────────────────────╯
✨ আমাদের পরিবারে আপনাকে স্বাগতম ✨`;

				if (CANVAS_OK) {
					try {
						await createBanner({
							output,
							avatarUrl,
							groupImage,
							adderAvatar,
							name: userName,
							groupName: chatTitle,
							adderName,
							member: memberCount
						});
						if (typeof api.sendPhoto === "function") {
							await api.sendPhoto(threadID, fs.createReadStream(output), { caption: welcomeMessage }).catch(async () => await api.sendMessage(welcomeMessage, threadID).catch(() => {}));
						} else {
							await api.sendMessage(welcomeMessage, threadID).catch(() => {});
						}
						setTimeout(() => fs.unlink(output, () => {}), 30000);
						return;
					} catch {}
				}

				await api.sendMessage(welcomeMessage, threadID).catch(async () => await message.send?.(welcomeMessage).catch(() => {}));
			} catch (error) {
				console.log("[WELCOME ERROR]", error?.stack || error);
			}
		};
	}

};
