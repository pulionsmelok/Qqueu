const { exec } = require("child_process");

module.exports = {
	config: {
    name: "shell",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 2,
        usePrefix: true,
    description: {
            en: "Execute a shell command (Bot Admin only).",
            bn: "Execute a shell কমান্ড (Bot Admin only)."
        },
        category: "owner",
        guide: {
            en: "{pn} <command>",
            bn: "{pn} <কমান্ড>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" },
        bn: { syntaxError: "দয়া করে সঠিক সিনট্যাক্স ব্যবহার করুন: {pn}!" }
    },
	onStart: async function ({ args, message }) {
		const command = args.join(" ").trim();
		if (!command) return message.reply("❌ Please provide a shell command.");
		exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
			let output = "";
			if (stdout) output += stdout;
			if (stderr) output += (output ? "\n" : "") + stderr;
			if (error && !output) output = error.message;
			if (!output) output = "(no output)";
			const prefix = error ? "❌ Shell error:\n" : "✅ Shell output:\n";
			const text = prefix + output;
			const chunks = text.match(/[\s\S]{1,3900}/g) || [text];
			(async () => {
				for (const chunk of chunks) await message.reply(chunk);
			})();
		});
	}
};
