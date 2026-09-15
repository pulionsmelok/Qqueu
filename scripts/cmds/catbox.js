const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cat", "cb"],
    version: "1.5.0",
    author: "SK-SIDDIK-KHAN",
    role: 0,
    
    
    
    
    countDown: 5,
    description: {
            en: "Reply to an image, video, audio or file to upload it."
        },
        category: "utility",
        guide: {
            en: "/catbox"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;
    if (!messageReply?.attachments?.length) {
      return api.sendMessage(
        "❌ Please reply to an image, video, audio or file.",
        threadID,
        null,
        messageID
      );
    }
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    let waitMsg;
    try {
      waitMsg = await api.sendMessage(
        "✨ Uploading your attachment...\n\nPlease wait...",
        threadID
      );
    } catch (e) {}
    const results = [];
    for (let i = 0; i < messageReply.attachments.length; i++) {
      const attachment = messageReply.attachments[i];
      let filePath = null;
      try {
        if (!attachment.url) continue;
        let ext = "dat";
        if (attachment.type === "photo") ext = "jpg";
        else if (attachment.type === "video") ext = "mp4";
        else if (attachment.type === "audio") ext = "mp3";
        else if (attachment.type === "animated_image") ext = "gif";
        else if (attachment.filename) {
          const extension = path.extname(attachment.filename);
          if (extension) ext = extension.slice(1);
        }
        filePath = path.join(
          cacheDir,
          `catbox_${Date.now()}_${i}.${ext}`
        );
        const response = await axios({
          method: "GET",
          url: attachment.url,
          responseType: "stream",
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });
        let uploadedUrl = null;
        try {
          const form = new FormData();
          form.append("reqtype", "fileupload");
          form.append(
            "fileToUpload",
            fs.createReadStream(filePath),
            {
              filename:
                attachment.filename ||
                `telegram_${Date.now()}.${ext}`
            }
          );
          const upload = await axios.post(
            "https://catbox.moe/user/api.php",
            form,
            {
              headers: form.getHeaders(),
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              validateStatus: () => true
            }
          );
          const result = String(upload.data || "").trim();
          if (
            result.startsWith("https://") ||
            result.startsWith("http://")
          ) {
            uploadedUrl = result;
          }
        } catch (e) {}
        if (!uploadedUrl) {
          try {
            const litterForm = new FormData();
            litterForm.append("reqtype", "fileupload");
            litterForm.append("time", "72h");
            litterForm.append(
              "fileToUpload",
              fs.createReadStream(filePath),
              {
                filename:
                  attachment.filename ||
                  `telegram_${Date.now()}.${ext}`
              }
            );
            const upload = await axios.post(
              "https://litterbox.catbox.moe/resources/internals/api.php",
              litterForm,
              {
                headers: litterForm.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: () => true
              }
            );
            const result = String(upload.data || "").trim();
            if (
              result.startsWith("https://") ||
              result.startsWith("http://")
            ) {
              uploadedUrl = result;
            }
          } catch (e) {}
        }
        if (uploadedUrl) {
          results.push(uploadedUrl);
        }
      } catch (e) {
        console.error("CATBOX:", e.message);
      } finally {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }
      }
    }
    if (waitMsg?.messageID && api.unsendMessage) {
      try {
        await api.unsendMessage(waitMsg.messageID);
      } catch (e) {}
    }
    if (results.length) {
      return api.sendMessage(
        results.join("\n"),
        threadID,
        null,
        messageID
      );
    }
    return api.sendMessage(
      "❌ Upload failed.",
      threadID,
      null,
      messageID
    );
  }
};
