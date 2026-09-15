module.exports = {
    config: {
    name: "siddik",
        aliases: [],
        version: "1.5.0",
        author: "SK-SIDDIK-KHAN",
        countDown: 5,
        role: 0,
        usePrefix: true,
    description: {
            en: "Command description"
        },
        category: "reply",
        guide: {
            en: "{pn}"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" }
    },
onStart: async function(){},
onChat: async function({
    event,
    message,
    getLang
}) {
    if (event.body && event.body.toLowerCase() == "SIDDIK") return message.reply("╭─────❃\n│🤷‍♂️ 𝙰𝙿𝙽𝙰𝚁 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂\n│💔 𝚂𝙸𝙳𝙳𝙸𝙺 𝙺𝙴 𝙿𝚁𝙾𝚈𝙾𝙹𝙾𝙽\n╰────────────✦");
     if (event.body && event.body.toLowerCase() == "Sk Siddik") return message.reply("╭─────❃\n│𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄 𝙰𝙻𝙰𝙸𝙺𝚄𝙼\n│🤷‍♂️ 𝙰𝙺𝙷𝙾𝙽 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂\n│💔 𝚂𝙸𝙳𝙳𝙸𝙺 𝙾𝙽𝙴𝙺 𝙱𝚄𝚂𝚈 \n│𝙺𝙸 𝙱𝙾𝙻𝙱𝙴𝙽 𝙰𝙼𝙰𝙺𝙴\n│𝙱𝙾𝙻𝚃𝙴 𝙿𝙰𝚁𝙴𝙽\n╰────────────✦");
     if (event.body && event.body.toLowerCase() == "Siddik") return message.reply("╭─────❃\n│🤷‍♂️ 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂 𝙺𝙴 𝙳𝙰𝙺𝙾\n│𝙺𝙴𝙽 𝙿𝚁𝙴𝙼 𝙺𝙾𝚁𝙱𝙰 𝙽𝙰𝙺𝙸\n 🫢\n╰────────────✦");
     if (event.body && event.body.toLowerCase() == "siddik") return message.reply("╭─────❃\n│🤷‍♂️ 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂 𝙺𝙴 𝙳𝙰𝙺𝙾\n│𝙺𝙴𝙽 𝙿𝚁𝙴𝙼 𝙺𝙾𝚁𝙱𝙰 𝙽𝙰𝙺𝙸 🫣\n╰────────────✦");
     if (event.body && event.body.toLowerCase() == "Sk Siddik Khan") return message.reply("╭─────❃\n│🤷‍♂️ 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂 𝙺𝙴 𝙳𝙰𝙺𝙾\n│𝙺𝙴𝙽 𝙿𝚁𝙴𝙼 𝙺𝙾𝚁𝙱𝙰 𝙽𝙰𝙺𝙸 🫣\n╰────────────✦");
     if (event.body && event.body.toLowerCase() == "Sk") return message.reply("╭─────❃\n│🤷‍♂️ 𝙰𝙼𝙰𝚁 𝙱𝙾𝚂𝚂 𝙺𝙴 𝙳𝙰𝙺𝙾\n│𝙺𝙴𝙽 𝙿𝚁𝙴𝙼 𝙺𝙾𝚁𝙱𝙰 𝙽𝙰𝙺𝙸 🫢\n╰────────────✦");
    }
    }
